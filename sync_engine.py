from __future__ import annotations

import json
from datetime import datetime
from loguru import logger
from sqlalchemy import text

from config import SYNC_INTERVAL_SECONDS
from sheets_client import SheetsClient
from db_client import (
    engine, upsert_corrida, upsert_movimiento,
    get_dirty_movimientos, mark_synced, AREA_NOMBRE_DB
)
from mapping import (
    PLANEACION, CENTRAL, DIESEL, ADDBLUE, TALLER,
    DESFOGUE, LAVADO_EXTERIOR, LAVADO_INTERIOR, TIEMPOS, KPIS,
    PULL_ORDER, PUSH_ORDER
)

# Global de módulo: una sola conexión a Sheets, abierta una vez al importar
# y reutilizada en todos los ciclos de sync (pull_all/push_all), en vez de
# reautenticar en cada llamada.
sheets = SheetsClient()

# type_id por defecto cuando se crea un registro sin pasar por PLANEACION
# (placeholder de camión fantasma) o se pull-ea CENTRAL sin corrida asociada.
# Corresponde a "AU" en bus_types — el operador corrige el tipo real después.
DEFAULT_TIPO_ID = 1

# Un serial de Excel es la fracción del día transcurrida (0.5 = mediodía);
# se usan para convertir datetime/time de Postgres al mismo formato decimal.
SECONDS_PER_DAY = 24 * 60 * 60
SECONDS_PER_HOUR = 60 * 60
SECONDS_PER_MINUTE = 60


# PULL

def pull_all():
    """Ejecuta el ciclo completo de PULL para todas las hojas"""
    logger.info("----- INICIO PULL -----")
    inicio = datetime.now()
    errores = {}

    for nombre_hoja, config in PULL_ORDER:
        try:
            _pull_hoja(nombre_hoja, config)
        except Exception as e:
            logger.error(f"[PULL] Error en hoja {nombre_hoja}: {e}")
            errores[nombre_hoja] = str(e)

    _log_sync("PULL_ALL", "pull", errores=errores, inicio=inicio)
    logger.info(f"------ FIN PULL ({(datetime.now()-inicio).seconds}s) -----")


def _pull_hoja(nombre: str, config: dict):
    """Lee y aplica al DB todas las filas de una hoja (o el snapshot de KPIS).

    Asume que `config` viene de PULL_ORDER (tiene la forma de PLANEACION/
    CENTRAL/TALLER/TIEMPOS/area_config según corresponda a `nombre`).
    """
    if nombre == "KPIS":
        _pull_kpis(config)
        return

    rows = sheets.read_range(config["sheet"], config["rango"])
    logger.info(f"[PULL] {nombre}: {len(rows)} filas leídas")

    # Una transacción por fila: si una fila falla, Postgres aborta esa
    # transacción pero las demás filas siguen en transacciones nuevas. Con
    # una sola transacción para toda la hoja, el primer error envenena la
    # conexión y tira TODA la hoja del ciclo (ver InFailedSqlTransaction).
    for sheets_row, row in enumerate(rows, start=2):   # fila 2 = primera de datos
        try:
            with engine.begin() as conn:
                if nombre == "PLANEACION":
                    _pull_row_planeacion(conn, row, sheets_row, config)
                elif nombre == "CENTRAL":
                    _pull_row_central(conn, row, sheets_row, config)
                elif nombre == "TALLER":
                    _pull_row_taller(conn, row, sheets_row, config)
                elif nombre == "TIEMPOS":
                    _pull_row_tiempos(conn, row, sheets_row, config)
                else:
                    _pull_row_area(conn, row, sheets_row, config, nombre)
        except Exception as e:
            logger.warning(f"[PULL] {nombre} fila {sheets_row}: {e}")


def _pull_row_planeacion(conn, row, sheets_row, config):
    """Sube una fila de PLANEACION a `trips` vía upsert_corrida (Last Write Wins).

    Asume `conn` dentro de una transacción abierta; filas sin serie se ignoran.
    """
    data = {}
    for col_idx, campo, fn in config["columnas"]:
        val = row[col_idx] if col_idx < len(row) else None
        data[campo] = fn(val)

    # Aplicar reglas de negocio
    for regla in config["reglas_negocio"]:
        if regla["condicion"](data):
            regla["accion"](data)

    if not data.get("serie"):
        return

    upsert_corrida(conn, data, sheets_row)


def _pull_row_central(conn, row, sheets_row, config):
    """Upsertea el registro CENTRAL de una serie y su checklist de áreas.

    Asume `conn` dentro de una transacción abierta; si el registro ya existe
    con last_modified_by='app', el Sheet no lo pisa (WHERE de la query).
    """
    from mapping import parse_int, parse_float, parse_bool, excel_serial_to_datetime

    data = {}
    for col_idx, campo, fn in config["columnas_registro"]:
        val = row[col_idx] if col_idx < len(row) else None
        data[campo] = fn(val)

    if not data.get("serie"):
        return

    conn.execute(text("""
        INSERT INTO records (date, serial_number, type_id, registration_time, progress, location_text, time_remaining,
                              sheets_row, last_modified_by, sheets_synced_at, is_dirty)
        VALUES (CURRENT_DATE, :serie, :tipo_id, :hora_registro, :avance, :ubicacion_texto, :tiempo_restante,
                :sheets_row, 'sheets', now(), false)
        ON CONFLICT (date, serial_number) DO UPDATE SET
            progress=EXCLUDED.progress,
            location_text=EXCLUDED.location_text,
            time_remaining=EXCLUDED.time_remaining,
            sheets_row=EXCLUDED.sheets_row,
            sheets_synced_at=now(),
            is_dirty=false
        WHERE records.last_modified_by = 'sheets'
    """), {**data, "sheets_row": sheets_row, "tipo_id": DEFAULT_TIPO_ID})

    # Upsert checklist
    registro = conn.execute(
        text("SELECT id FROM records WHERE date=CURRENT_DATE AND serial_number=:s"), {"s": data["serie"]}
    ).fetchone()
    if not registro:
        return

    registro_id = registro[0]
    for col_bool, col_num, area_nombre in config["columnas_checklist"]:
        completada = parse_bool(row[col_bool] if col_bool < len(row) else None)
        espacios   = parse_int(row[col_num]   if col_num  < len(row) else None)
        from db_client import get_area_id
        area_id = get_area_id(conn, area_nombre)
        if not area_id:
            continue
        # area_checklists no tiene columnas de tracking (is_dirty/last_modified_by);
        # el Sheet siempre gana aquí, no hay protección de "last write wins".
        conn.execute(text("""
            INSERT INTO area_checklists (record_id, area_id, is_checked, quantity)
            VALUES (:r, :a, :c, :e)
            ON CONFLICT (record_id, area_id) DO UPDATE SET
                is_checked=EXCLUDED.is_checked, quantity=EXCLUDED.quantity
        """), {"r": registro_id, "a": area_id, "c": completada, "e": espacios})


def _pull_row_area(conn, row, sheets_row, config, nombre):
    """Upsertea un movimiento de área (DIESEL/ADDBLUE/DESFOGUE/LAVADO*) vía upsert_movimiento.

    Asume `conn` dentro de una transacción abierta; ignora filas sin serie u
    hora de entrada.
    """
    from mapping import parse_int, parse_float, parse_bool, parse_time_str, excel_serial_to_datetime

    data = {}
    for col_idx, campo, fn in config["columnas"]:
        val = row[col_idx] if col_idx < len(row) else None
        data[campo] = fn(val)

    if not data.get("serie") or not data.get("hora_entrada"):
        return

    # hora_entrada final: preferir el decimal de Excel (más preciso)
    if data.get("hora_entrada_excel"):
        data["hora_entrada"] = data["hora_entrada_excel"]
    data.pop("hora_entrada_excel", None)
    data.pop("espacios_disp", None)

    upsert_movimiento(conn, data, config["area_nombre"], sheets_row)


def _pull_row_taller(conn, row, sheets_row, config):
    """Upsertea el movimiento de TALLER y su detalle en workshop_details.

    Asume `conn` dentro de una transacción abierta; el detalle solo se
    escribe si el movimiento y su registro asociado ya existen en el DB.
    """
    from mapping import parse_int, parse_bool, parse_float, parse_time_str, excel_serial_to_datetime

    data_mov = {}
    for col_idx, campo, fn in config["columnas_movimiento"]:
        val = row[col_idx] if col_idx < len(row) else None
        data_mov[campo] = fn(val)

    if not data_mov.get("serie"):
        return

    if data_mov.get("hora_entrada_excel"):
        data_mov["hora_entrada"] = data_mov["hora_entrada_excel"]
    data_mov.pop("hora_entrada_excel", None)

    upsert_movimiento(conn, data_mov, "TALLER", sheets_row)

    # Buscar el movimiento recién insertado para agregar detalle
    from db_client import get_area_id
    area_id = get_area_id(conn, "TALLER")
    from datetime import date
    registro = conn.execute(
        text("SELECT id FROM records WHERE date=:f AND serial_number=:s"),
        {"f": date.today(), "s": data_mov["serie"]}
    ).fetchone()
    if not registro:
        return

    movimiento = conn.execute(
        text("SELECT id FROM movements WHERE record_id=:r AND area_id=:a ORDER BY id DESC LIMIT 1"),
        {"r": registro[0], "a": area_id}
    ).fetchone()
    if not movimiento:
        return

    detalle = {}
    for col_idx, campo in config["columnas_detalle"]:
        val = row[col_idx] if col_idx < len(row) else None
        fn = config["conversion_detalle"].get(campo, config["conversion_detalle"]["default"])
        detalle[campo] = fn(val)

    # workshop_details no tiene UNIQUE(movement_id) ni columnas de tracking,
    # así que el upsert se hace a mano en vez de ON CONFLICT.
    existe = conn.execute(
        text("SELECT id FROM workshop_details WHERE movement_id=:m"), {"m": movimiento[0]}
    ).fetchone()

    campos  = ", ".join(detalle.keys())
    valores = ", ".join(f":{k}" for k in detalle.keys())
    update  = ", ".join(f"{k}=:{k}" for k in detalle.keys())

    if existe:
        conn.execute(
            text(f"UPDATE workshop_details SET {update} WHERE movement_id=:movement_id"),
            {"movement_id": movimiento[0], **detalle}
        )
    else:
        conn.execute(
            text(f"INSERT INTO workshop_details (movement_id, {campos}) VALUES (:movement_id, {valores})"),
            {"movement_id": movimiento[0], **detalle}
        )


def _pull_row_tiempos(conn, row, sheets_row, config):
    """Upsertea la fila de TIEMPOS en `times` (clave única: serial_number).

    Asume `conn` dentro de una transacción abierta; si el registro ya existe
    con last_modified_by='app', el Sheet no lo pisa (WHERE de la query).
    """
    data = {}
    for col_idx, campo, fn in config["columnas"]:
        val = row[col_idx] if col_idx < len(row) else None
        data[campo] = fn(val)

    if not data.get("serie"):
        return

    for campo, fn in config.get("campo_calculado", {}).items():
        data[campo] = fn(data)

    conn.execute(text("""
        INSERT INTO times (
            serial_number, entry_time, is_completed, exit_time_num, entry_time_num,
            duration_days, sheets_row, last_modified_by, sheets_synced_at, is_dirty
        ) VALUES (
            :serie, :hora_entrada, :completado, :hora_salida_num, :hora_entrada_num,
            :duracion_dias, :sheets_row, 'sheets', now(), false
        )
        ON CONFLICT (serial_number) DO UPDATE SET
            entry_time=EXCLUDED.entry_time, is_completed=EXCLUDED.is_completed,
            exit_time_num=EXCLUDED.exit_time_num, entry_time_num=EXCLUDED.entry_time_num,
            duration_days=EXCLUDED.duration_days, sheets_row=EXCLUDED.sheets_row,
            sheets_synced_at=now(), is_dirty=false
        WHERE times.last_modified_by = 'sheets'
    """), {**data, "sheets_row": sheets_row})


def _pull_kpis(config):
    """Lee el snapshot de KPIs celda por celda y lo inserta en kpis__snapshot.

    Siempre INSERT (nunca UPSERT); una celda que falle al leerse queda en
    None mas no aborta el snapshot completo.
    """
    data = {}
    for celda, campo, fn in config["celdas"]:
        try:
            val = sheets.read_cell(config["sheet"], celda)
            data[campo] = fn(val)
        except Exception as e:
            logger.warning(f"[PULL] KPIS celda {celda} ({campo}): {e}")
            data[campo] = None

    with engine.begin() as conn:
        campos  = ", ".join(data.keys())
        valores = ", ".join(f":{k}" for k in data.keys())
        conn.execute(
            text(f"INSERT INTO kpis__snapshot ({campos}) VALUES ({valores})"),
            data
        )
    logger.info("[PULL] KPIs guardados")



# PUSH

def push_all():
    """Pushea a Sheets todos los registros marcados como is_dirty=true"""
    logger.info("------ INICIO PUSH -----")
    inicio = datetime.now()
    errores = {}

    for nombre_hoja, config in PUSH_ORDER:
        try:
            _push_hoja(nombre_hoja, config)
        except Exception as e:
            logger.error(f"[PUSH] Error en hoja {nombre_hoja}: {e}")
            errores[nombre_hoja] = str(e)

    _log_sync("PUSH_ALL", "push", errores=errores, inicio=inicio)
    logger.info(f"----- FIN PUSH ({(datetime.now()-inicio).seconds}s) -----")


def _push_hoja(nombre: str, config: dict):
    """Despacha el push de una hoja a su rutina específica según `nombre`."""
    if nombre in ("DIESEL","ADDBLUE","TALLER","DESFOGUE","LAVADO EXTERIOR","LAVADO INTERIOR"):
        _push_area(config)
    elif nombre == "CENTRAL":
        _push_central(config)
    elif nombre == "TIEMPOS":
        _push_tiempos(config)
    elif nombre == "PLANEACION":
        _push_planeacion(config)


def _push_area(config):
    """Pushea a Sheets los movimientos dirty (last_modified_by='app') de un área."""
    area_nombre = config["area_nombre"]
    with engine.begin() as conn:
        rows = get_dirty_movimientos(conn, area_nombre)
        for row in rows:
            fila = row.sheets_row
            hora_entrada_str = row.entry_time.strftime("%H:%M:%S") if row.entry_time else ""
            hora_salida_num  = _datetime_to_excel_serial(row.exit_time)
            hora_entrada_num = _time_to_excel_serial(row.entry_time)
            duracion = (hora_salida_num - hora_entrada_num) if hora_salida_num and hora_entrada_num else ""

            valores = [
                row.serie,
                hora_entrada_str,
                row.is_completed,
                hora_salida_num or "",
                hora_entrada_num or "",
                "",   # espacios_disp: no modificar desde la app
            ]

            if fila:
                sheets.write_row(config["sheet"], fila, valores)
            else:
                nueva_fila = sheets.append_row(config["sheet"], valores)
                conn.execute(
                    text("UPDATE movements SET sheets_row=:r WHERE id=:id"),
                    {"r": nueva_fila, "id": row.id}
                )

            mark_synced(conn, "movements", row.id)
            logger.info(f"[PUSH] {area_nombre} serie={row.serie} fila={fila}")


def _push_central(config):
    """Pushea registros dirty (last_modified_by='app') al sheet CENTRAL."""
    with engine.begin() as conn:
        from datetime import date
        registros = conn.execute(
            text("""
                SELECT r.*
                FROM records r
                WHERE r.date=:f AND r.is_dirty=true AND r.last_modified_by='app'
            """),
            {"f": date.today()}
        ).fetchall()

        for reg in registros:
            checklist = conn.execute(
                text("""
                    SELECT a.name, ca.is_checked, ca.quantity
                    FROM area_checklists ca JOIN area a ON a.id=ca.area_id
                    WHERE ca.record_id=:r
                """),
                {"r": reg.id}
            ).fetchall()

            check_map = {c.name: (c.is_checked, c.quantity) for c in checklist}

            def bool_num(nombre):
                b, n = check_map.get(AREA_NOMBRE_DB.get(nombre, nombre), (False, 0))
                return [b, n or 0]

            hora_reg = _datetime_to_excel_serial(reg.registration_time)
            valores = (
                [hora_reg, reg.serial_number] +
                bool_num("DIESEL") + bool_num("ADDBLUE") + bool_num("TALLER") +
                bool_num("DESFOGUE") + bool_num("LAVADO EXTERIOR") + bool_num("LAVADO INTERIOR") +
                [reg.location_text or "", reg.time_remaining or "", reg.progress or 0]
            )
            if reg.sheets_row:
                sheets.write_row(config["sheet"], reg.sheets_row, valores)
            else:
                fila = sheets.append_row(config["sheet"], valores)
                conn.execute(
                    text("UPDATE records SET sheets_row=:r WHERE id=:id"),
                    {"r": fila, "id": reg.id}
                )
            mark_synced(conn, "records", reg.id)
            logger.info(f"[PUSH] CENTRAL serie={reg.serial_number} fila={reg.sheets_row or 'append'}")


def _push_tiempos(config):
    """Pushea a Sheets los tiempos dirty (last_modified_by='app')."""
    with engine.begin() as conn:
        rows = conn.execute(
            text("SELECT * FROM times WHERE is_dirty=true AND last_modified_by='app'")
        ).fetchall()

        for row in rows:
            fila = row.sheets_row
            valores = [
                row.serial_number,
                row.entry_time.strftime("%H:%M:%S") if row.entry_time else "",
                row.is_completed,
                row.exit_time_num or "",
                row.entry_time_num or "",
            ]
            if fila:
                sheets.write_row(config["sheet"], fila, valores)
            else:
                fila = sheets.append_row(config["sheet"], valores)
                conn.execute(
                    text("UPDATE times SET sheets_row=:r WHERE id=:id"),
                    {"r": fila, "id": row.id}
                )
            mark_synced(conn, "times", row.id)
            logger.info(f"[PUSH] TIEMPOS serie={row.serial_number} fila={fila}")



def _push_planeacion(config):
    """Pushea a Sheets las corridas dirty (last_modified_by='app'), agregadas
    ad-hoc vía POST /corridas y no solo las planeadas originalmente en el Sheet."""
    with engine.begin() as conn:
        from datetime import date
        corridas = conn.execute(
            text("""
                SELECT t.id, t.serial_number, t.scheduled_time, t.departure_time,
                       t.needs_reception, t.needs_drainage, t.needs_diesel,
                       t.needs_adblue, t.needs_ext_wash, t.needs_int_wash,
                       t.needs_workshop, t.sheets_row, bt.name AS tipo_nombre
                FROM trips t JOIN bus_types bt ON bt.id = t.type_id
                WHERE t.date = :f AND t.is_dirty = true AND t.last_modified_by = 'app'
            """),
            {"f": date.today()}
        ).fetchall()

        for corrida in corridas:
            fila = corrida.sheets_row
            valores = [
                _time_to_excel_serial(corrida.scheduled_time) or "",
                corrida.serial_number,
                corrida.tipo_nombre,
                corrida.needs_reception or 0,
                corrida.needs_drainage or 0,
                corrida.needs_diesel or 0,
                corrida.needs_adblue or 0,
                corrida.needs_ext_wash or 0,
                corrida.needs_int_wash or 0,
                corrida.needs_workshop or 0,
                _time_to_excel_serial(corrida.departure_time) or "",
            ]

            if fila:
                sheets.write_row(config["sheet"], fila, valores)
            else:
                fila = sheets.append_row(config["sheet"], valores)
                conn.execute(
                    text("UPDATE trips SET sheets_row=:r WHERE id=:id"),
                    {"r": fila, "id": corrida.id}
                )

            mark_synced(conn, "trips", corrida.id)
            logger.info(f"[PUSH] PLANEACION serie={corrida.serial_number} fila={fila}")


# CICLO PRINCIPAL

def run_sync_cycle():
    """Un ciclo completo: primero PULL, luego PUSH"""
    try:
        pull_all()
    except Exception as e:
        logger.error(f"PULL falló: {e}")
    try:
        push_all()
    except Exception as e:
        logger.error(f"PUSH falló: {e}")


# ── Utilidades

def _datetime_to_excel_serial(dt) -> float | None:
    """Convierte un datetime de Postgres al serial decimal de Excel (inverso de excel_serial_to_datetime)."""
    if dt is None:
        return None
    from mapping import EXCEL_EPOCH
    # Postgres devuelve TIMESTAMPTZ como datetime aware (sesión en UTC); el
    # valor original vino de un EXCEL_EPOCH naive, así que se quita el tzinfo
    # para poder restar sin perder ni desplazar la hora.
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    delta = dt - EXCEL_EPOCH
    return delta.days + delta.seconds / SECONDS_PER_DAY


def _time_to_excel_serial(t) -> float | None:
    """Igual que _datetime_to_excel_serial pero para columnas TIME (sin fecha)."""
    if t is None:
        return None
    total_seconds = t.hour * SECONDS_PER_HOUR + t.minute * SECONDS_PER_MINUTE + t.second
    return total_seconds / SECONDS_PER_DAY


def _log_sync(hoja: str, direccion: str, errores: dict, inicio: datetime):
    """Inserta un registro en sync_logs para un ciclo PULL_ALL/PUSH_ALL completo.

    `errores` es un dict {nombre_hoja: mensaje} de las hojas que fallaron en
    ese ciclo (vacío si todas corrieron sin excepción no capturada).
    """
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO sync_logs (sheet, direction, errors, started_at, finished_at, success)
                VALUES (:h, :d, CAST(:e AS jsonb), :i, now(), :ok)
            """),
            {"h": hoja, "d": direccion, "e": json.dumps(errores) if errores else None,
             "i": inicio, "ok": len(errores) == 0}
        )
