
from datetime import datetime, date
from loguru import logger
from sqlalchemy import create_engine, text
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# ── Helpers ────────────────────────────────────────────────

def get_tipo_id(conn, nombre: str) -> int | None:
    row = conn.execute(
        text("SELECT id FROM tipos_camion WHERE nombre = :n"), {"n": nombre}
    ).fetchone()
    return row[0] if row else None

def get_area_id(conn, nombre: str) -> int | None:
    row = conn.execute(
        text("SELECT id FROM areas WHERE nombre = :n"), {"n": nombre}
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
        text("SELECT id, last_modified_at, last_modified_by FROM corridas WHERE fecha=:f AND serie=:s"),
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
                UPDATE corridas SET
                    hora_corrida=:hora_corrida, hora_salida=:hora_salida,
                    tipo_id=:tipo_id, need_recepcion=:need_recepcion,
                    need_desfogue=:need_desfogue, need_diesel=:need_diesel,
                    need_adblue=:need_adblue, need_lav_ext=:need_lav_ext,
                    need_lav_int=:need_lav_int, need_taller=:need_taller,
                    sheets_row=:sheets_row, last_modified_by='sheets',
                    sheets_synced_at=:sheets_synced_at, is_dirty=false
                WHERE fecha=:fecha AND serie=:serie
            """), data
        )
    else:
        data["is_dirty"] = False
        conn.execute(
            text("""
                INSERT INTO corridas (
                    fecha, hora_corrida, hora_salida, serie, tipo_id,
                    need_recepcion, need_desfogue, need_diesel, need_adblue,
                    need_lav_ext, need_lav_int, need_taller,
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

    registro = conn.execute(
        text("SELECT id FROM registros WHERE fecha=:f AND serie=:s"),
        {"f": date.today(), "s": data["serie"]}
    ).fetchone()

    registro_id = registro[0] if registro else _create_registro_placeholder(conn, data["serie"])

    existing = conn.execute(
        text("""
            SELECT id, last_modified_by FROM movimientos
            WHERE registro_id=:r AND area_id=:a
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
                UPDATE movimientos SET
                    hora_entrada=:hora_entrada, hora_salida=:hora_salida,
                    completado=:completado, duracion_dias=:duracion_dias,
                    sheets_row=:sheets_row, last_modified_by='sheets',
                    sheets_synced_at=:now, is_dirty=false
                WHERE id=:id
            """),
            {**data, "id": existing[0], "sheets_row": sheets_row, "now": now}
        )
    else:
        conn.execute(
            text("""
                INSERT INTO movimientos (
                    registro_id, area_id, serie, hora_entrada, hora_salida,
                    completado, duracion_dias, sheets_row,
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
            SELECT m.*, r.serie
            FROM movimientos m
            JOIN registros r ON r.id = m.registro_id
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
        text("SELECT row_to_json(r) FROM registros r WHERE fecha=:f AND turno=:t"),
        {"f": date.today(), "t": turno}
    ).fetchall()

    movimientos = conn.execute(
        text("""
            SELECT row_to_json(m) FROM movimientos m
            JOIN registros r ON r.id = m.registro_id
            WHERE r.fecha=:f AND r.turno=:t
        """),
        {"f": date.today(), "t": turno}
    ).fetchall()

    conn.execute(
        text("""
            INSERT INTO cierres_turno (fecha, turno, cerrado_por, snapshot_registros, snapshot_movimientos)
            VALUES (:f, :t, :u, :sr::jsonb, :sm::jsonb)
        """),
        {
            "f": date.today(), "t": turno, "u": usuario_id,
            "sr": str([r[0] for r in registros]),
            "sm": str([m[0] for m in movimientos]),
        }
    )

    conn.execute(
        text("UPDATE registros SET activo=false WHERE fecha=:f AND turno=:t"),
        {"f": date.today(), "t": turno}
    )
    logger.info(f"Turno {turno} archivado correctamente.")

# ── HELPERS INTERNOS

def _create_registro_placeholder(conn, serie: int) -> int:
    """Crea un registro mínimo si no existe (el operador lo completará)"""
    result = conn.execute(
        text("""
            INSERT INTO registros (fecha, serie, tipo_id, last_modified_by)
            VALUES (:f, :s, 1, 'sheets')
            ON CONFLICT (fecha, serie) DO NOTHING
            RETURNING id
        """),
        {"f": date.today(), "s": serie}
    ).fetchone()
    if result:
        return result[0]
    return conn.execute(
        text("SELECT id FROM registros WHERE fecha=:f AND serie=:s"),
        {"f": date.today(), "s": serie}
    ).fetchone()[0]

def _log_conflict(conn, hoja: str, serie: int, ts_app: datetime):
    logger.warning(f"[CONFLICT LOG] hoja={hoja} serie={serie} app_ts={ts_app}")
