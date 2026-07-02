from __future__ import annotations

import json
from datetime import datetime, date
from loguru import logger
from sqlalchemy import create_engine, text
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# El schema en Supabase usa nombres de área en inglés; el resto del código
# (Sheets, mapping.py) sigue usando los nombres en español.
AREA_NOMBRE_DB = {
    "DIESEL":          "DIESEL",
    "ADDBLUE":         "ADDBLUE",
    "TALLER":          "WORKSHOP",
    "DESFOGUE":        "DRAINAGE",
    "LAVADO EXTERIOR": "EXTERIOR WASH",
    "LAVADO INTERIOR": "INTERIOR WASH",
    "RECEPCION":       "RECEPTION",
}

# ── Helpers ────────────────────────────────────────────────

def get_tipo_id(conn, nombre: str) -> int | None:
    row = conn.execute(
        text("SELECT id FROM bus_types WHERE name = :n"), {"n": nombre}
    ).fetchone()
    return row[0] if row else None

def get_area_id(conn, nombre: str) -> int | None:
    row = conn.execute(
        text("SELECT id FROM area WHERE name = :n"), {"n": AREA_NOMBRE_DB.get(nombre, nombre)}
    ).fetchone()
    return row[0] if row else None

# ── CORRIDAS ───────────────────────────────────────────────

def upsert_corrida(conn, data: dict, sheets_row: int):
    """
    Last Write Wins
    """
    tipo_id = get_tipo_id(conn, data.pop("tipo_nombre", None))
    if not tipo_id:
        logger.warning(f"Tipo de camión no encontrado para corrida serie={data.get('serie')}")
        return

    data["tipo_id"] = tipo_id
    data["sheets_row"] = sheets_row
    data["last_modified_by"] = "sheets"
    data["sheets_synced_at"] = datetime.now()
    data["fecha"] = date.today()

    existing = conn.execute(
        text("SELECT id, last_modified_at, last_modified_by FROM trips WHERE date=:f AND serial_number=:s"),
        {"f": data["fecha"], "s": data["serie"]}
    ).fetchone()

    if existing:
        # Conflicto: si la app modificó más recientemente, Sheets no pisó
        if existing.last_modified_by == 'app':
            logger.info(f"[CONFLICT] corrida serie={data['serie']}: app gana (más reciente)")
            _log_conflict(conn, "PLANEACION", data["serie"], existing.last_modified_at)
            return
        conn.execute(
            text("""
                UPDATE trips SET
                    scheduled_time=:hora_corrida, departure_time=:hora_salida,
                    type_id=:tipo_id, needs_reception=:need_recepcion,
                    needs_drainage=:need_desfogue, needs_diesel=:need_diesel,
                    needs_adblue=:need_adblue, needs_ext_wash=:need_lav_ext,
                    needs_int_wash=:need_lav_int, needs_workshop=:need_taller,
                    sheets_row=:sheets_row, last_modified_by='sheets',
                    sheets_synced_at=:sheets_synced_at, is_dirty=false
                WHERE date=:fecha AND serial_number=:serie
            """), data
        )
    else:
        data["is_dirty"] = False
        conn.execute(
            text("""
                INSERT INTO trips (
                    date, scheduled_time, departure_time, serial_number, type_id,
                    needs_reception, needs_drainage, needs_diesel, needs_adblue,
                    needs_ext_wash, needs_int_wash, needs_workshop,
                    sheets_row, last_modified_by, sheets_synced_at, is_dirty
                ) VALUES (
                    :fecha, :hora_corrida, :hora_salida, :serie, :tipo_id,
                    :need_recepcion, :need_desfogue, :need_diesel, :need_adblue,
                    :need_lav_ext, :need_lav_int, :need_taller,
                    :sheets_row, 'sheets', :sheets_synced_at, false
                )
            """), data
        )

# ── MOVIMIENTOS

def upsert_movimiento(conn, data: dict, area_nombre: str, sheets_row: int):
    area_id = get_area_id(conn, area_nombre)
    if not area_id:
        return

    # TALLER trae duracion_dias del Sheet; las demás áreas no, así que se
    # rellena con NULL para que el bind de la query siempre tenga el valor.
    data.setdefault("duracion_dias", None)

    registro = conn.execute(
        text("SELECT id FROM records WHERE date=:f AND serial_number=:s"),
        {"f": date.today(), "s": data["serie"]}
    ).fetchone()

    # Las pestañas de área del Sheet NO tienen columna de fecha, así que cada
    # fila histórica se re-importaba como movimiento de HOY y materializaba un
    # camión fantasma en el patio (33 buses, áreas sobre capacidad). Una fila
    # ya completada (Salida=TRUE) de un camión sin registro hoy es historia,
    # no un camión presente: no crear el placeholder.
    if not registro and data.get("completado"):
        return

    registro_id = registro[0] if registro else _create_registro_placeholder(conn, data["serie"])

    existing = conn.execute(
        text("""
            SELECT id, last_modified_by FROM movements
            WHERE record_id=:r AND area_id=:a
            ORDER BY id DESC LIMIT 1
        """),
        {"r": registro_id, "a": area_id}
    ).fetchone()

    now = datetime.now()

    if existing:
        if existing.last_modified_by == 'app':
            logger.info(f"[CONFLICT] movimiento serie={data['serie']} área={area_nombre}: app gana")
            return
        conn.execute(
            text("""
                UPDATE movements SET
                    entry_time=:hora_entrada, exit_time=:hora_salida,
                    is_completed=:completado, duration_days=:duracion_dias,
                    sheets_row=:sheets_row, last_modified_by='sheets',
                    sheets_synced_at=:now, is_dirty=false
                WHERE id=:id
            """),
            {**data, "id": existing[0], "sheets_row": sheets_row, "now": now}
        )
    else:
        conn.execute(
            text("""
                INSERT INTO movements (
                    record_id, area_id, serial_number, entry_time, exit_time,
                    is_completed, duration_days, sheets_row,
                    last_modified_by, sheets_synced_at, is_dirty
                ) VALUES (
                    :registro_id, :area_id, :serie, :hora_entrada, :hora_salida,
                    :completado, :duracion_dias, :sheets_row,
                    'sheets', :now, false
                )
            """),
            {**data, "registro_id": registro_id, "area_id": area_id,
             "sheets_row": sheets_row, "now": now}
        )

# ── DIRTY RECORDS (para PUSH)

def get_dirty_movimientos(conn, area_nombre: str) -> list:
    """Retorna movimientos modificados por la app que aún no se pusharon a Sheets"""
    area_id = get_area_id(conn, area_nombre)
    return conn.execute(
        text("""
            SELECT m.*, r.serial_number AS serie
            FROM movements m
            JOIN records r ON r.id = m.record_id
            WHERE m.area_id = :a
              AND m.is_dirty = true
              AND m.last_modified_by = 'app'
        """),
        {"a": area_id}
    ).fetchall()

def mark_synced(conn, tabla: str, id: int):
    """Marca un registro como sincronizado (is_dirty=false)"""
    conn.execute(
        text(f"UPDATE {tabla} SET is_dirty=false, sheets_synced_at=now() WHERE id=:id"),
        {"id": id}
    )

# ── CIERRE DE TURNO 

def archivar_turno(conn, turno: int, usuario_id: int):
    """
    Archiva el turno actual: crea un snapshot JSON y cierra los registros activos.
    """
    registros = conn.execute(
        text("SELECT row_to_json(r) FROM records r WHERE date=:f AND shift=:t"),
        {"f": date.today(), "t": turno}
    ).fetchall()

    movimientos = conn.execute(
        text("""
            SELECT row_to_json(m) FROM movements m
            JOIN records r ON r.id = m.record_id
            WHERE r.date=:f AND r.shift=:t
        """),
        {"f": date.today(), "t": turno}
    ).fetchall()

    conn.execute(
        text("""
            INSERT INTO shift_closures (date, shift, closed_by, records_snapshot, movements_snapshot)
            VALUES (:f, :t, :u, CAST(:sr AS jsonb), CAST(:sm AS jsonb))
        """),
        {
            "f": date.today(), "t": turno, "u": usuario_id,
            "sr": json.dumps([r[0] for r in registros]),
            "sm": json.dumps([m[0] for m in movimientos]),
        }
    )

    conn.execute(
        text("UPDATE records SET is_active=false WHERE date=:f AND shift=:t"),
        {"f": date.today(), "t": turno}
    )
    logger.info(f"Turno {turno} archivado correctamente.")

# ── HELPERS INTERNOS

def _create_registro_placeholder(conn, serie: int) -> int:
    """Crea un registro mínimo si no existe (el operador lo completará)"""
    result = conn.execute(
        text("""
            INSERT INTO records (date, serial_number, type_id, last_modified_by)
            VALUES (:f, :s, 1, 'sheets')
            ON CONFLICT (date, serial_number) DO NOTHING
            RETURNING id
        """),
        {"f": date.today(), "s": serie}
    ).fetchone()
    if result:
        return result[0]
    return conn.execute(
        text("SELECT id FROM records WHERE date=:f AND serial_number=:s"),
        {"f": date.today(), "s": serie}
    ).fetchone()[0]

def _log_conflict(conn, hoja: str, serie: int, ts_app: datetime):
    logger.warning(f"[CONFLICT LOG] hoja={hoja} serie={serie} app_ts={ts_app}")
