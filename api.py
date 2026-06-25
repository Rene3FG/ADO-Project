import os
import json
import bcrypt
from datetime import datetime, date
from typing import Optional
from contextlib import contextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text

from config import DATABASE_URL
from db_client import AREA_NOMBRE_DB

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

@contextmanager
def db():
    with engine.connect() as conn:
        with conn.begin():
            yield conn

def row_to_dict(row):
    return dict(row._mapping)

def rows_to_list(rows):
    return [row_to_dict(r) for r in rows]


# ── Modelos Pydantic ──────────────────────────────────────────────

class CorrridaUpdate(BaseModel):
    hora_corrida:   Optional[str]  = None
    hora_salida:    Optional[str]  = None
    tipo_nombre:    Optional[str]  = None
    need_recepcion: Optional[int]  = None
    need_desfogue:  Optional[int]  = None
    need_diesel:    Optional[int]  = None
    need_adblue:    Optional[int]  = None
    need_lav_ext:   Optional[int]  = None
    need_lav_int:   Optional[int]  = None
    need_taller:    Optional[int]  = None

class CorridaCreate(BaseModel):
    serie:          int
    tipo_nombre:    str
    hora_corrida:   Optional[str] = None
    hora_salida:    Optional[str] = None
    need_recepcion: Optional[int] = 0
    need_desfogue:  Optional[int] = 0
    need_diesel:    Optional[int] = 0
    need_adblue:    Optional[int] = 0
    need_lav_ext:   Optional[int] = 0
    need_lav_int:   Optional[int] = 0
    need_taller:    Optional[int] = 0

class RegistroUpdate(BaseModel):
    ubicacion_texto: Optional[str]   = None
    tiempo_restante: Optional[float] = None
    avance:          Optional[float] = None

class MovimientoCreate(BaseModel):
    serie:        int
    area_nombre:  str
    hora_entrada: Optional[str] = None

class MovimientoUpdate(BaseModel):
    hora_salida:   Optional[str]   = None
    completado:    Optional[bool]  = None
    duracion_dias: Optional[float] = None

class ArchivarTurnoRequest(BaseModel):
    turno:      int
    usuario_id: int

class LoginRequest(BaseModel):
    username: str
    password: str

class AreaCreate(BaseModel):
    nombre: str
    capacidad: Optional[int] = 4


# ── App FastAPI + CORS ────────────────────────────────────────────

app = FastAPI(
    title="SCA API",
    version="1.0.0",
    description="API REST para el Sistema de Control de Autobuses — ADO Oaxaca",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Corridas (`/corridas`) ────────────────────────────────────────

CORRIDA_COLUMNS = (
    "c.id, c.date AS fecha, c.serial_number AS serie, c.type_id AS tipo_id,"
    " c.scheduled_time AS hora_corrida, c.departure_time AS hora_salida,"
    " c.needs_reception AS need_recepcion, c.needs_drainage AS need_desfogue,"
    " c.needs_diesel AS need_diesel, c.needs_adblue AS need_adblue,"
    " c.needs_ext_wash AS need_lav_ext, c.needs_int_wash AS need_lav_int,"
    " c.needs_workshop AS need_taller, c.sheets_row, c.is_dirty,"
    " c.last_modified_by, c.last_modified_at, c.sheets_synced_at"
)

# Pydantic (español) -> columna real en "trips"
CORRIDA_FIELD_DB = {
    "hora_corrida":   "scheduled_time",
    "hora_salida":    "departure_time",
    "need_recepcion": "needs_reception",
    "need_desfogue":  "needs_drainage",
    "need_diesel":    "needs_diesel",
    "need_adblue":    "needs_adblue",
    "need_lav_ext":   "needs_ext_wash",
    "need_lav_int":   "needs_int_wash",
    "need_taller":    "needs_workshop",
}

@app.get("/corridas", summary="Lista corridas del día")
def get_corridas(fecha: Optional[str] = Query(default=None, description="YYYY-MM-DD, default = hoy")):
    target = fecha or str(date.today())
    with db() as conn:
        rows = conn.execute(text(
            f"SELECT {CORRIDA_COLUMNS}, tc.name AS tipo_nombre"
            " FROM trips c JOIN bus_types tc ON c.type_id = tc.id"
            " WHERE c.date = :f ORDER BY c.serial_number"
        ), {"f": target}).fetchall()
    return rows_to_list(rows)

@app.get("/corridas/{serie}", summary="Detalle de una corrida")
def get_corrida(serie: int, fecha: Optional[str] = Query(default=None)):
    target = fecha or str(date.today())
    with db() as conn:
        row = conn.execute(text(
            f"SELECT {CORRIDA_COLUMNS}, tc.name AS tipo_nombre"
            " FROM trips c JOIN bus_types tc ON c.type_id = tc.id"
            " WHERE c.date = :f AND c.serial_number = :s"
        ), {"f": target, "s": serie}).fetchone()
    if not row:
        raise HTTPException(404, f"Corrida serie={serie} no encontrada para fecha={target}")
    return row_to_dict(row)

@app.put("/corridas/{serie}", summary="Actualiza corrida desde la UI")
def update_corrida(serie: int, body: CorrridaUpdate):
    target = str(date.today())
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    with db() as conn:
        existing = conn.execute(text(
            "SELECT id, type_id FROM trips WHERE date=:f AND serial_number=:s"
        ), {"f": target, "s": serie}).fetchone()
        if not existing:
            raise HTTPException(404, f"Corrida serie={serie} no encontrada")

        tipo_id = existing.type_id
        if "tipo_nombre" in updates:
            tipo_row = conn.execute(text(
                "SELECT id FROM bus_types WHERE name=:n"
            ), {"n": updates.pop("tipo_nombre")}).fetchone()
            if not tipo_row:
                raise HTTPException(400, "tipo_nombre no válido")
            tipo_id = tipo_row[0]

        set_clauses = ", ".join(f"{CORRIDA_FIELD_DB[k]}=:{k}" for k in updates)
        params = {**updates, "tipo_id": tipo_id, "f": target, "s": serie, "ts": datetime.now()}

        conn.execute(text(
            f"UPDATE trips SET {set_clauses}, type_id=:tipo_id,"
            " is_dirty=true, last_modified_by='app', last_modified_at=:ts"
            " WHERE date=:f AND serial_number=:s"
        ), params)

    return {"ok": True, "serie": serie, "fecha": target}

@app.post("/corridas", status_code=201, summary="Registra una corrida nueva (ad-hoc, fuera de PLANEACION)")
def create_corrida(body: CorridaCreate):
    target = str(date.today())
    with db() as conn:
        existing = conn.execute(text(
            "SELECT id FROM trips WHERE date=:f AND serial_number=:s"
        ), {"f": target, "s": body.serie}).fetchone()
        if existing:
            raise HTTPException(409, f"Ya existe una corrida serie={body.serie} para {target}")

        tipo_row = conn.execute(text(
            "SELECT id FROM bus_types WHERE name=:n"
        ), {"n": body.tipo_nombre}).fetchone()
        if not tipo_row:
            raise HTTPException(400, "tipo_nombre no válido")

        conn.execute(text(
            "INSERT INTO trips"
            " (date, serial_number, type_id, scheduled_time, departure_time,"
            "  needs_reception, needs_drainage, needs_diesel, needs_adblue,"
            "  needs_ext_wash, needs_int_wash, needs_workshop,"
            "  is_dirty, last_modified_by, last_modified_at)"
            " VALUES (:f, :s, :tipo_id, :hora_corrida, :hora_salida,"
            "  :need_recepcion, :need_desfogue, :need_diesel, :need_adblue,"
            "  :need_lav_ext, :need_lav_int, :need_taller,"
            "  true, 'app', :ts)"
        ), {
            "f": target, "s": body.serie, "tipo_id": tipo_row[0],
            "hora_corrida": body.hora_corrida, "hora_salida": body.hora_salida,
            "need_recepcion": body.need_recepcion, "need_desfogue": body.need_desfogue,
            "need_diesel": body.need_diesel, "need_adblue": body.need_adblue,
            "need_lav_ext": body.need_lav_ext, "need_lav_int": body.need_lav_int,
            "need_taller": body.need_taller, "ts": datetime.now(),
        })

    return get_corrida(body.serie, target)


# ── Registros (`/registros`) ──────────────────────────────────────

REGISTRO_COLUMNS = (
    "id, date AS fecha, serial_number AS serie, type_id AS tipo_id, shift AS turno,"
    " is_active AS activo, registration_time AS hora_registro, location_text AS ubicacion_texto,"
    " time_remaining AS tiempo_restante, progress AS avance, sheets_row, is_dirty,"
    " last_modified_by, last_modified_at, sheets_synced_at"
)

# Pydantic (español) -> columna real en "records"
REGISTRO_FIELD_DB = {
    "ubicacion_texto": "location_text",
    "tiempo_restante":  "time_remaining",
    "avance":           "progress",
}

@app.get("/registros", summary="Vista CENTRAL — todos los camiones activos hoy")
def get_registros(fecha: Optional[str] = Query(default=None)):
    target = fecha or str(date.today())
    with db() as conn:
        rows = conn.execute(text(
            f"SELECT {REGISTRO_COLUMNS} FROM records WHERE date = :f AND is_active = true ORDER BY serial_number"
        ), {"f": target}).fetchall()
    return rows_to_list(rows)

@app.get("/registros/{serie}", summary="Registro + checklist de un camión")
def get_registro(serie: int, fecha: Optional[str] = Query(default=None)):
    target = fecha or str(date.today())
    with db() as conn:
        row = conn.execute(text(
            f"SELECT {REGISTRO_COLUMNS} FROM records WHERE date = :f AND serial_number = :s AND is_active = true"
        ), {"f": target, "s": serie}).fetchone()
        if not row:
            raise HTTPException(404, f"Registro serie={serie} no encontrado para {target}")

        checklist = conn.execute(text(
            "SELECT ca.id, ca.record_id AS registro_id, ca.area_id,"
            " ca.is_checked AS completada, ca.quantity AS espacios, a.name AS area_nombre"
            " FROM area_checklists ca JOIN area a ON ca.area_id = a.id"
            " WHERE ca.record_id = :rid ORDER BY a.name"
        ), {"rid": row.id}).fetchall()

    result = row_to_dict(row)
    result["checklist"] = rows_to_list(checklist)
    return result

@app.put("/registros/{serie}", summary="Actualiza ubicación/avance desde la UI")
def update_registro(serie: int, body: RegistroUpdate):
    target = str(date.today())
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    with db() as conn:
        existing = conn.execute(text(
            "SELECT id FROM records WHERE date=:f AND serial_number=:s AND is_active=true"
        ), {"f": target, "s": serie}).fetchone()
        if not existing:
            raise HTTPException(404, f"Registro serie={serie} no encontrado")

        set_clauses = ", ".join(f"{REGISTRO_FIELD_DB[k]}=:{k}" for k in updates)
        params = {**updates, "f": target, "s": serie, "ts": datetime.now()}

        conn.execute(text(
            f"UPDATE records SET {set_clauses},"
            " is_dirty=true, last_modified_by='app', last_modified_at=:ts"
            " WHERE date=:f AND serial_number=:s"
        ), params)

    return {"ok": True, "serie": serie, "fecha": target}


# ── Movimientos (`/movimientos`) ──────────────────────────────────

# Pydantic (español) -> columna real en "movements"
MOVIMIENTO_FIELD_DB = {
    "hora_salida":   "exit_time",
    "completado":    "is_completed",
    "duracion_dias": "duration_days",
}

@app.get("/movimientos", summary="Lista movimientos con filtros opcionales")
def get_movimientos(
    area:  Optional[str] = Query(default=None, description="Nombre del área ej: DIESEL"),
    serie: Optional[int] = Query(default=None, description="Número de serie del camión"),
    fecha: Optional[str] = Query(default=None, description="YYYY-MM-DD, default = hoy"),
):
    target = fecha or str(date.today())
    q = (
        "SELECT m.id, m.record_id AS registro_id, m.area_id, m.serial_number AS serie,"
        " m.date AS fecha, m.entry_time AS hora_entrada, m.exit_time AS hora_salida,"
        " m.is_completed AS completado, m.duration_days AS duracion_dias,"
        " m.sheets_row, m.is_dirty, m.last_modified_by, m.last_modified_at, m.sheets_synced_at,"
        " a.name AS area_nombre"
        " FROM movements m JOIN area a ON m.area_id = a.id"
        " WHERE m.date = :f"
    )
    params = {"f": target}
    if area:
        q += " AND a.name = :area"
        params["area"] = AREA_NOMBRE_DB.get(area, area)
    if serie:
        q += " AND m.serial_number = :serie"
        params["serie"] = serie
    q += " ORDER BY m.entry_time"

    with db() as conn:
        rows = conn.execute(text(q), params).fetchall()

    # a.name es el nombre real en Postgres (ej. "WORKSHOP"); GET /areas ya
    # traduce esto al nombre estilo-Sheet (ej. "TALLER") que el resto de la
    # API y el frontend esperan — aquí se aplica la misma traducción para
    # que ambos endpoints describan las áreas de forma consistente.
    reverse_area = {v: k for k, v in AREA_NOMBRE_DB.items()}
    result = rows_to_list(rows)
    for r in result:
        r["area_nombre"] = reverse_area.get(r["area_nombre"], r["area_nombre"])
    return result

@app.post("/movimientos", status_code=201, summary="Registra entrada de camión a un área")
def create_movimiento(body: MovimientoCreate):
    with db() as conn:
        area_row = conn.execute(text(
            "SELECT id FROM area WHERE name = :n"
        ), {"n": AREA_NOMBRE_DB.get(body.area_nombre, body.area_nombre)}).fetchone()
        if not area_row:
            raise HTTPException(400, f"Área '{body.area_nombre}' no existe. "
                                     f"Consulta GET /areas para ver las disponibles.")
        area_id = area_row[0]

        registro = conn.execute(text(
            "SELECT id FROM records WHERE date=:f AND serial_number=:s AND is_active=true"
        ), {"f": date.today(), "s": body.serie}).fetchone()

        if not registro:
            r = conn.execute(text(
                "INSERT INTO records (date, serial_number, is_active, is_dirty, last_modified_by, last_modified_at)"
                " VALUES (:f, :s, true, true, 'app', NOW()) RETURNING id"
            ), {"f": date.today(), "s": body.serie}).fetchone()
            registro_id = r[0] if r else conn.execute(text(
                "SELECT id FROM records WHERE date=:f AND serial_number=:s"
            ), {"f": date.today(), "s": body.serie}).fetchone()[0]
        else:
            registro_id = registro[0]

        now = datetime.now()
        hora_entrada = body.hora_entrada or now.strftime("%H:%M:%S")

        result = conn.execute(text(
            "INSERT INTO movements"
            " (record_id, area_id, serial_number, date, entry_time, is_dirty, last_modified_by, last_modified_at)"
            " VALUES (:rid, :aid, :serie, CURRENT_DATE, :hora_entrada, true, 'app', :ts)"
            " RETURNING id"
        ), {
            "rid": registro_id, "aid": area_id,
            "serie": body.serie, "hora_entrada": hora_entrada, "ts": now,
        }).fetchone()

    return {"ok": True, "id": result[0], "serie": body.serie, "area": body.area_nombre}

@app.put("/movimientos/{mov_id}", summary="Actualiza datos de un movimiento")
def update_movimiento(mov_id: int, body: MovimientoUpdate):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No hay campos para actualizar")

    with db() as conn:
        if not conn.execute(text(
            "SELECT id FROM movements WHERE id=:id"
        ), {"id": mov_id}).fetchone():
            raise HTTPException(404, f"Movimiento id={mov_id} no encontrado")

        set_clauses = ", ".join(f"{MOVIMIENTO_FIELD_DB[k]}=:{k}" for k in updates)
        conn.execute(text(
            f"UPDATE movements SET {set_clauses},"
            " is_dirty=true, last_modified_by='app', last_modified_at=:ts"
            " WHERE id=:id"
        ), {**updates, "id": mov_id, "ts": datetime.now()})

    return {"ok": True, "id": mov_id}

@app.put("/movimientos/{mov_id}/completar", summary="Marca un movimiento como completado")
def completar_movimiento(mov_id: int):
    with db() as conn:
        if not conn.execute(text(
            "SELECT id FROM movements WHERE id=:id"
        ), {"id": mov_id}).fetchone():
            raise HTTPException(404, f"Movimiento id={mov_id} no encontrado")

        now = datetime.now()
        conn.execute(text(
            "UPDATE movements SET is_completed=true, exit_time=:ts,"
            " is_dirty=true, last_modified_by='app', last_modified_at=:ts"
            " WHERE id=:id"
        ), {"id": mov_id, "ts": now})

    return {"ok": True, "id": mov_id, "completado": True}


# ── Lookups, Tiempos y KPIs ────────────────────────────────────────

@app.get("/areas", summary="Lista de áreas de servicio")
def get_areas():
    reverse_area = {v: k for k, v in AREA_NOMBRE_DB.items()}
    with db() as conn:
        rows = conn.execute(text("SELECT id, name, capacity FROM area ORDER BY name")).fetchall()
    return [
        {"id": r.id, "nombre": reverse_area.get(r.name, r.name), "capacidad": r.capacity}
        for r in rows
    ]

@app.post("/areas", status_code=201, summary="Crea una nueva área de servicio (admin)")
def create_area(body: AreaCreate):
    with db() as conn:
        existing = conn.execute(text(
            "SELECT id FROM area WHERE name = :n"
        ), {"n": body.nombre}).fetchone()
        if existing:
            raise HTTPException(409, f"El área '{body.nombre}' ya existe")

        row = conn.execute(text(
            "INSERT INTO area (name, capacity) VALUES (:n, :c) RETURNING id"
        ), {"n": body.nombre, "c": body.capacidad}).fetchone()

    return {"id": row[0], "nombre": body.nombre, "capacidad": body.capacidad}

@app.delete("/areas/{area_id}", summary="Elimina un área de servicio (admin)")
def delete_area(area_id: int):
    with db() as conn:
        if not conn.execute(text(
            "SELECT id FROM area WHERE id = :id"
        ), {"id": area_id}).fetchone():
            raise HTTPException(404, f"Área id={area_id} no encontrada")

        en_uso = conn.execute(text(
            "SELECT 1 FROM movements WHERE area_id = :id"
            " UNION ALL SELECT 1 FROM area_checklists WHERE area_id = :id LIMIT 1"
        ), {"id": area_id}).fetchone()
        if en_uso:
            raise HTTPException(409, "El área tiene movimientos o checklists asociados, no se puede eliminar")

        conn.execute(text("DELETE FROM area WHERE id = :id"), {"id": area_id})

    return {"ok": True, "id": area_id}

@app.get("/tipos-camion", summary="Lista de tipos de camión")
def get_tipos():
    with db() as conn:
        rows = conn.execute(text("SELECT id, name AS nombre FROM bus_types ORDER BY name")).fetchall()
    return rows_to_list(rows)

@app.get("/tiempos", summary="Tiempos de servicio — Sheet TIEMPOS")
def get_tiempos():
    with db() as conn:
        rows = conn.execute(text(
            "SELECT id, serial_number AS serie, entry_time AS hora_entrada,"
            " is_completed AS completado, exit_time_num AS hora_salida_num,"
            " entry_time_num AS hora_entrada_num, duration_days AS duracion_dias"
            " FROM times ORDER BY entry_time"
        )).fetchall()
    return rows_to_list(rows)

@app.get("/kpis", summary="Último snapshot de KPIs")
def get_kpis():
    with db() as conn:
        row = conn.execute(text(
            "SELECT id, captured_at,"
            " total_buses AS total_camiones, buses_needing_workshop AS camiones_necesitan_taller,"
            " released_buses AS camiones_liberados, serviced_buses AS camiones_atendidos,"
            " buses_in_bays AS camiones_en_andenes, foreign_buses AS camiones_foraneos,"
            " buses_needing_wash AS camiones_necesitan_lavado,"
            " priority_units_completed AS unidades_prioritarias_cumplidas,"
            " mechanics_count AS num_mecanicos, total_bay_capacity AS capacidad_total_andenes,"
            " pct_needing_workshop AS pct_necesitan_taller, pct_released AS pct_liberados,"
            " workload_per_mechanic AS carga_por_mecanico, bay_utilization AS utilizacion_andenes,"
            " foreign_bus_flow AS flujo_foraneos, pct_needing_wash AS pct_necesitan_lavado,"
            " priority_compliance AS cumplimiento_prioridad"
            " FROM kpis__snapshot ORDER BY id DESC LIMIT 1"
        )).fetchone()
    if not row:
        raise HTTPException(404, "No hay snapshots de KPIs todavía")
    return row_to_dict(row)


# ── Cierre de turno (`/turno/archivar`) ───────────────────────────
# Igual a archivar_turno() en db_client.py pero expuesto como REST.

@app.post("/turno/archivar", summary="Cierra y archiva un turno")
def archivar_turno(body: ArchivarTurnoRequest):
    with db() as conn:
        registros = conn.execute(text(
            "SELECT row_to_json(r) FROM records r WHERE date=:f AND shift=:t"
        ), {"f": date.today(), "t": body.turno}).fetchall()

        movimientos = conn.execute(text(
            "SELECT row_to_json(m) FROM movements m"
            " WHERE m.date=:f"
            " AND m.record_id IN (SELECT id FROM records WHERE date=:f AND shift=:t)"
        ), {"f": date.today(), "t": body.turno}).fetchall()

        conn.execute(text(
            "INSERT INTO shift_closures (date, shift, closed_by, records_snapshot, movements_snapshot)"
            " VALUES (:f, :t, :u, CAST(:sr AS jsonb), CAST(:sm AS jsonb))"
        ), {
            "f": date.today(),
            "t": body.turno,
            "u": body.usuario_id,
            "sr": json.dumps([r[0] for r in registros]),
            "sm": json.dumps([m[0] for m in movimientos]),
        })

        conn.execute(text(
            "UPDATE records SET is_active=false WHERE date=:f AND shift=:t"
        ), {"f": date.today(), "t": body.turno})

    return {
        "ok": True,
        "turno": body.turno,
        "registros_archivados": len(registros),
        "movimientos_archivados": len(movimientos),
    }


# ── Login (`/login`) ───────────────────────────────────────────────
# Verifica contra users/roles, esquema del equipo Diseño/Formularios
# (ver "TABLAS DE OTRO DOMINIO" en schema.sql). Esta API solo lee esas
# tablas, no las crea ni las modifica.

@app.post("/login", summary="Verifica credenciales contra users/roles")
def login(body: LoginRequest):
    with db() as conn:
        row = conn.execute(text(
            "SELECT u.id, u.username, u.first_name, u.last_name,"
            " u.password_hash, u.is_active, r.name AS rol"
            " FROM users u JOIN roles r ON u.role_id = r.id"
            " WHERE u.username = :username"
        ), {"username": body.username}).fetchone()

    credenciales_invalidas = HTTPException(401, "Usuario o contraseña incorrectos")
    if not row or not row.is_active or not row.password_hash:
        raise credenciales_invalidas
    if not bcrypt.checkpw(body.password.encode(), row.password_hash.encode()):
        raise credenciales_invalidas

    return {
        "id": row.id,
        "username": row.username,
        "nombre": f"{row.first_name} {row.last_name}".strip(),
        "rol": row.rol,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
