from datetime import datetime
from loguru import logger
from sqlalchemy import text

from config import SYNC_INTERVAL_SECONDS
from sheets_client import SheetsClient
from db_client import (
    engine, upsert_corrida, upsert_movimiento,
    get_dirty_movimientos, mark_synced
)
from mapping import (
    PLANEACION, CENTRAL, DIESEL, ADDBLUE, TALLER,
    DESFOGUE, LAVADO_EXTERIOR, LAVADO_INTERIOR, TIEMPOS, KPIS,
    PULL_ORDER, PUSH_ORDER
)

sheets = SheetsClient()


# PULL

def pull_all():
    """Ejecuta el ciclo completo de PULL para todas las hojas"""
    logger.info("═══ INICIO PULL ═══")
    inicio = datetime.now()
    errores = {}

    for nombre_hoja, config in PULL_ORDER:
        try:
            _pull_hoja(nombre_hoja, config)
        except Exception as e:
            logger.error(f"[PULL] Error en hoja {nombre_hoja}: {e}")
            errores[nombre_hoja] = str(e)

    _log_sync("PULL_ALL", "pull", errores=errores, inicio=inicio)
    logger.info(f"═══ FIN PULL ({(datetime.now()-inicio).seconds}s) ═══")


def _pull_hoja(nombre: str, config: dict):
    if nombre == "KPIS":
        _pull_kpis(config)
        return

    rows = sheets.read_range(config["sheet"], config["rango"])
    logger.info(f"[PULL] {nombre}: {len(rows)} filas leídas")

    with engine.begin() as conn:
        for i, row in enumerate(rows, start=2):   # fila 2 = primera de datos
            try:
                if nombre == "PLANEACION":
                    _pull_row_planeacion(conn, row, i, config)
                elif nombre == "CENTRAL":
                    _pull_row_central(conn, row, i, config)
                elif nombre == "TALLER":
                    _pull_row_taller(conn, row, i, config)
                else:
                    _pull_row_area(conn, row, i, config, nombre)
            except Exception as e:
                logger.warning(f"[PULL] {nombre} fila {i}: {e}")


def _pull_row_planeacion(conn, row, sheets_row, config):
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
    from mapping import parse_int, parse_float, parse_bool, excel_serial_to_datetime

    data = {}
    for col_idx, campo, fn in config["columnas_registro"]:
        val = row[col_idx] if col_idx < len(row) else None
        data[campo] = fn(val)

    if not data.get("serie"):
        return

    # Upsert registro
    from db_client import get_tipo_id
    from datetime import date
    with engine.begin() as _:
        pass  # conn ya viene del contexto

    conn.execute(text("""
        INSERT INTO registros (fecha, serie, tipo_id, hora_registro, avance, ubicacion_texto, tiempo_restante,
                               sheets_row, last_modified_by, sheets_synced_at, is_dirty)
        VALUES (CURRENT_DATE, :serie, 1, :hora_registro, :avance, :ubicacion_texto, :tiempo_restante,
                :sheets_row, 'sheets', now(), false)
        ON CONFLICT (fecha, serie) DO UPDATE SET
            avance=EXCLUDED.avance,
            ubicacion_texto=EXCLUDED.ubicacion_texto,
            tiempo_restante=EXCLUDED.tiempo_restante,
            sheets_row=EXCLUDED.sheets_row,
            sheets_synced_at=now(),
            is_dirty=false
        WHERE registros.last_modified_by = 'sheets'
    """), {**data, "sheets_row": sheets_row})

    # Upsert checklist
    registro = conn.execute(
        text("SELECT id FROM registros WHERE fecha=CURRENT_DATE AND serie=:s"), {"s": data["serie"]}
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
        conn.execute(text("""
            INSERT INTO checklist_areas (registro_id, area_id, completada, espacios, last_modified_by, is_dirty)
            VALUES (:r, :a, :c, :e, 'sheets', false)
            ON CONFLICT (registro_id, area_id) DO UPDATE SET
                completada=EXCLUDED.completada, espacios=EXCLUDED.espacios,
                sheets_synced_at=now(), is_dirty=false
            WHERE checklist_areas.last_modified_by = 'sheets'
        """), {"r": registro_id, "a": area_id, "c": completada, "e": espacios})


def _pull_row_area(conn, row, sheets_row, config, nombre):
    from mapping import parse_int, parse_float, parse_bool, parse_time_str, excel_serial_to_datetime

    data = {}
    for col_idx, campo, fn in config["columnas"]:
        val = row[col_idx] if col_idx < len(row) else None
        data[campo] = fn(val)

    if not data.get("serie") or not data.get("hora_entrada"):
        return

    # hora_entrada final: preferir el decimal de Excel (más preciso)
    if data.get("hora_entrada2"):
        data["hora_entrada"] = data["hora_entrada2"]
    data.pop("hora_entrada2", None)
    data.pop("espacios_disp", None)

    upsert_movimiento(conn, data, config["area_nombre"], sheets_row)


def _pull_row_taller(conn, row, sheets_row, config):
    from mapping import parse_int, parse_bool, parse_float, parse_time_str, excel_serial_to_datetime

    data_mov = {}
    for col_idx, campo, fn in config["columnas_movimiento"]:
        val = row[col_idx] if col_idx < len(row) else None
        data_mov[campo] = fn(val)

    if not data_mov.get("serie"):
        return

    if data_mov.get("hora_entrada2"):
        data_mov["hora_entrada"] = data_mov["hora_entrada2"]
    data_mov.pop("hora_entrada2", None)

    upsert_movimiento(conn, data_mov, "TALLER", sheets_row)

    # Buscar el movimiento recién insertado para agregar detalle
    from db_client import get_area_id
    area_id = get_area_id(conn, "TALLER")
    from datetime import date
    registro = conn.execute(
        text("SELECT id FROM registros WHERE fecha=:f AND serie=:s"),
        {"f": date.today(), "s": data_mov["serie"]}
    ).fetchone()
    if not registro:
        return

    movimiento = conn.execute(
        text("SELECT id FROM movimientos WHERE registro_id=:r AND area_id=:a ORDER BY id DESC LIMIT 1"),
        {"r": registro[0], "a": area_id}
    ).fetchone()
    if not movimiento:
        return

    detalle = {}
    for col_idx, campo in config["columnas_detalle"]:
        val = row[col_idx] if col_idx < len(row) else None
        fn = config["conversion_detalle"].get(campo, config["conversion_detalle"]["default"])
        detalle[campo] = fn(val)

    conn.execute(text("""
        INSERT INTO taller_detalle (movimiento_id, {campos}, last_modified_by, is_dirty)
        VALUES (:movimiento_id, {valores}, 'sheets', false)
        ON CONFLICT (movimiento_id) DO UPDATE SET
            {update}, sheets_synced_at=now(), is_dirty=false
        WHERE taller_detalle.last_modified_by = 'sheets'
    """.format(
        campos  = ", ".join(detalle.keys()),
        valores = ", ".join(f":{k}" for k in detalle.keys()),
        update  = ", ".join(f"{k}=EXCLUDED.{k}" for k in detalle.keys()),
    )), {"movimiento_id": movimiento[0], **detalle})


def _pull_kpis(config):
    data = {}
    for celda, campo, fn in config["celdas"]:
        try:
            val = sheets.read_cell(config["sheet"], celda)
            data[campo] = fn(val)
        except Exception:
            data[campo] = None

    with engine.begin() as conn:
        from datetime import date
        campos  = ", ".join(data.keys())
        valores = ", ".join(f":{k}" for k in data.keys())
        conn.execute(
            text(f"INSERT INTO kpis_snapshot (fecha, {campos}, sheets_synced_at) VALUES (CURRENT_DATE, {valores}, now())"),
            data
        )
    logger.info("[PULL] KPIs guardados")



# PUSH

def push_all():
    """Pushea a Sheets todos los registros marcados como is_dirty=true"""
    logger.info("═══ INICIO PUSH ═══")
    inicio = datetime.now()
    errores = {}

    for nombre_hoja, config in PUSH_ORDER:
        try:
            _push_hoja(nombre_hoja, config)
        except Exception as e:
            logger.error(f"[PUSH] Error en hoja {nombre_hoja}: {e}")
            errores[nombre_hoja] = str(e)

    _log_sync("PUSH_ALL", "push", errores=errores, inicio=inicio)
    logger.info(f"═══ FIN PUSH ({(datetime.now()-inicio).seconds}s) ═══")


def _push_hoja(nombre: str, config: dict):
    if nombre in ("DIESEL","ADDBLUE","TALLER","DESFOGUE","LAVADO EXTERIOR","LAVADO INTERIOR"):
        _push_area(config)
    elif nombre == "CENTRAL":
        _push_central(config)
    elif nombre == "TIEMPOS":
        _push_tiempos(config)


def _push_area(config):
    area_nombre = config["area_nombre"]
    with engine.begin() as conn:
        rows = get_dirty_movimientos(conn, area_nombre)
        for row in rows:
            fila = row.sheets_row
            hora_entrada_str = row.hora_entrada.strftime("%H:%M:%S") if row.hora_entrada else ""
            hora_salida_num  = _datetime_to_excel_serial(row.hora_salida)
            hora_entrada_num = _datetime_to_excel_serial(row.hora_entrada)
            duracion = (hora_salida_num - hora_entrada_num) if hora_salida_num and hora_entrada_num else ""

            valores = [
                row.serie,
                hora_entrada_str,
                row.completado,
                hora_salida_num or "",
                hora_entrada_num or "",
                "",   # espacios_disp: no modificar desde la app
            ]

            if fila:
                sheets.write_row(config["sheet"], fila, valores)
            else:
                nueva_fila = sheets.append_row(config["sheet"], valores)
                conn.execute(
                    text("UPDATE movimientos SET sheets_row=:r WHERE id=:id"),
                    {"r": nueva_fila, "id": row.id}
                )

            mark_synced(conn, "movimientos", row.id)
            logger.info(f"[PUSH] {area_nombre} serie={row.serie} fila={fila}")


def _push_central(config):
    """Re-escribe el estado del CENTRAL desde PostgreSQL"""
    with engine.begin() as conn:
        from datetime import date
        registros = conn.execute(
            text("""
                SELECT r.*, t.nombre as tipo_nombre
                FROM registros r JOIN tipos_camion t ON t.id=r.tipo_id
                WHERE r.fecha=:f AND r.is_dirty=true AND r.last_modified_by='app'
            """),
            {"f": date.today()}
        ).fetchall()

        for reg in registros:
            if not reg.sheets_row:
                continue

            checklist = conn.execute(
                text("""
                    SELECT a.nombre, ca.completada, ca.espacios
                    FROM checklist_areas ca JOIN areas a ON a.id=ca.area_id
                    WHERE ca.registro_id=:r ORDER BY a.orden_flujo
                """),
                {"r": reg.id}
            ).fetchall()

            check_map = {c.nombre: (c.completada, c.espacios) for c in checklist}

            def bool_num(nombre):
                b, n = check_map.get(nombre, (False, 0))
                return [b, n or 0]

            hora_reg = _datetime_to_excel_serial(reg.hora_registro)
            valores = (
                [hora_reg, reg.serie] +
                bool_num("DIESEL") + bool_num("ADDBLUE") + bool_num("TALLER") +
                bool_num("DESFOGUE") + bool_num("LAVADO EXTERIOR") + bool_num("LAVADO INTERIOR") +
                [reg.ubicacion_texto or "", reg.tiempo_restante or "", reg.avance or 0]
            )
            sheets.write_row(config["sheet"], reg.sheets_row, valores)
            mark_synced(conn, "registros", reg.id)


def _push_tiempos(config):
    with engine.begin() as conn:
        from datetime import date
        rows = conn.execute(
            text("""
                SELECT t.* FROM tiempos t
                JOIN registros r ON r.id=t.registro_id
                WHERE r.fecha=:f AND t.is_dirty=true AND t.last_modified_by='app'
            """),
            {"f": date.today()}
        ).fetchall()

        for row in rows:
            valores = [
                row.serie,
                row.hora_entrada.strftime("%H:%M:%S") if row.hora_entrada else "",
                row.completado,
                row.hora_salida_num or "",
                row.hora_entrada_num or "",
            ]
            if row.sheets_row:
                sheets.write_row(config["sheet"], row.sheets_row, valores)
            mark_synced(conn, "tiempos", row.id)



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
    if dt is None:
        return None
    from mapping import EXCEL_EPOCH
    delta = dt - EXCEL_EPOCH
    return delta.days + delta.seconds / 86400


def _log_sync(hoja: str, direccion: str, errores: dict, inicio: datetime):
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO sync_log (hoja, direccion, errores, iniciado_at, finalizado_at, exitoso)
                VALUES (:h, :d, :e::jsonb, :i, now(), :ok)
            """),
            {"h": hoja, "d": direccion, "e": str(errores) if errores else None,
             "i": inicio, "ok": len(errores) == 0}
        )
