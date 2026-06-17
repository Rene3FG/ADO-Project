from datetime import datetime, timedelta, time
from config import SPREADSHEET_ID

# Nombre hojas
SHEET_NAMES = {
    "PLANEACION":       "PLANEACION",
    "CENTRAL":          "CENTRAL",
    "DIESEL":           "DIESEL",
    "ADDBLUE":          "ADDBLUE",
    "TALLER":           "TALLER",
    "DESFOGUE":         "DESFOGUE",
    "LAVADO_EXTERIOR":  "LAVADO EXTERIOR",
    "LAVADO_INTERIOR":  "LAVADO INTERIOR",
    "TIEMPOS":          "TIEMPOS",
    "KPIS":             "KPI'S",          
}

EXCEL_EPOCH = datetime(1899, 12, 30)

def excel_serial_to_datetime(serial):
    """0.5 → 12:00:00  |  46182.43648 → datetime completo"""
    if serial is None or serial == '':
        return None
    serial = float(serial)
    return EXCEL_EPOCH + timedelta(days=serial)

def excel_serial_to_time(serial):
    if serial is None or serial == '':
        return None
    dt = excel_serial_to_datetime(serial)
    return dt.time()

def parse_bool(val):
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.strip().upper() == 'TRUE'
    return False

def parse_int(val, default=None):
    try:
        return int(float(val)) if val not in (None, '') else default
    except (ValueError, TypeError):
        return default

def parse_float(val, default=None):
    try:
        return float(val) if val not in (None, '') else default
    except (ValueError, TypeError):
        return default

def parse_time_str(val):
    """'11:19:32' → time object"""
    if not val:
        return None
    try:
        parts = str(val).strip().split(':')
        return time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
    except Exception:
        return None


PLANEACION = {
    "sheet":        SHEET_NAMES["PLANEACION"],
    "rango":        "A2:K1000",
    "tabla_pg":     "trips",
    "clave_unica":  ["fecha", "serie"],
    "columnas": [
        # (indice_col_0, campo_pg, funcion_conversion)
        (0,  "hora_corrida",   excel_serial_to_time),
        (1,  "serie",          parse_int),
        (2,  "tipo_nombre",    str),          # se convierte a tipo_id al insertar
        (3,  "need_recepcion", parse_int),
        (4,  "need_desfogue",  parse_int),
        (5,  "need_diesel",    parse_int),
        (6,  "need_adblue",    parse_int),
        (7,  "need_lav_ext",   parse_int),
        (8,  "need_lav_int",   parse_int),
        (9,  "need_taller",    lambda v: parse_int(v)),
        (10, "hora_salida",    excel_serial_to_time),
    ],
    "reglas_negocio": [
        # tipos que no requieren desfogue/adblue
        {
            "condicion": lambda row: row.get("tipo_nombre") in ("AU", "SUR", "TXO"),
            "accion":    lambda row: row.update({"need_desfogue": 0, "need_adblue": 0})
        }
    ]
}

# ────────────────────────────────────────────────────────────

CENTRAL = {
    "sheet":    SHEET_NAMES["CENTRAL"],
    "rango":    "A2:S200",
    "tabla_registros":  "records",
    "tabla_checklist":  "area_checklists",
    "clave_unica": ["fecha", "serie"],

    "columnas_registro": [
        (0,  "hora_registro",   excel_serial_to_datetime),
        (1,  "serie",           parse_int),
        (14, "ubicacion_texto", str),
        (15, "tiempo_restante", parse_float),
        (16, "avance",          parse_float),
    ],

    # Columnas del checklist: (col_bool, col_num, nombre_area)
    "columnas_checklist": [
        (2,  3,  "DIESEL"),
        (4,  5,  "ADDBLUE"),
        (6,  7,  "TALLER"),
        (8,  9,  "DESFOGUE"),
        (10, 11, "LAVADO EXTERIOR"),
        (12, 13, "LAVADO INTERIOR"),
    ],
}

# ────────────────────────────────────────────────────────────

def area_config(sheet_key, area_nombre):
    return {
        "sheet":       SHEET_NAMES[sheet_key],
        "rango":       "A2:F500",
        "tabla_pg":    "movements",
        "area_nombre": area_nombre,
        "clave_unica": ["serie", "hora_entrada"],
        "columnas": [
            (0, "serie",         parse_int),
            (1, "hora_entrada",  parse_time_str),     # string "HH:MM:SS"
            (2, "completado",    parse_bool),
            (3, "hora_salida",   excel_serial_to_datetime),
            (4, "hora_entrada2", excel_serial_to_time),  # decimal Excel
            (5, "espacios_disp", parse_int),  # solo para lectura, no se persiste
        ],
        # hora_entrada final = hora_entrada2 (decimal) si existe, sino parse de col 1
    }

DIESEL          = area_config("DIESEL",          "DIESEL")
ADDBLUE         = area_config("ADDBLUE",         "ADDBLUE")
DESFOGUE        = area_config("DESFOGUE",        "DESFOGUE")
LAVADO_EXTERIOR = area_config("LAVADO_EXTERIOR", "LAVADO EXTERIOR")
LAVADO_INTERIOR = area_config("LAVADO_INTERIOR", "LAVADO INTERIOR")

# ────────────────────────────────────────────────────────────

TALLER = {
    "sheet":          SHEET_NAMES["TALLER"],
    "rango":          "A2:T500",
    "tabla_pg":       "movements",
    "tabla_detalle":  "workshop_details",
    "area_nombre":    "TALLER",
    "clave_unica":    ["serie", "hora_entrada"],

    "columnas_movimiento": [
        (0, "serie",         parse_int),
        (1, "hora_entrada",  parse_time_str),
        (2, "completado",    parse_bool),
        (3, "hora_salida",   excel_serial_to_datetime),
        (4, "hora_entrada2", excel_serial_to_time),
        (5, "duracion_dias", parse_float),
    ],

    # Columnas de subáreas: (indice, campo_workshop_details)
    # workshop_details (Supabase) separó "transmisión/frenos" en dos columnas
    # y agregó oil_change/battery_check/shock_absorbers, que el Sheet aún
    # no tiene como columnas propias — quedan en su default (false) hasta
    # que se agregue esa fuente de datos.
    "columnas_detalle": [
        (6,  "tires"),
        (7,  "preventive_maintenance"),
        (8,  "alignment_pit"),
        (9,  "air_conditioning"),
        (10, "transmission_inspection"),
        (10, "brakes_inspection"),
        (11, "engine"),
        (12, "electrical"),
        (13, "vans"),
        (14, "upholstery"),
        (15, "bodywork_peripherals"),
        (16, "paint_peripherals"),
        (17, "paint_pinflo"),
        (18, "bodywork_pinflo"),
        (19, "progress_percentage"),
    ],
    "conversion_detalle": {
        "progress_percentage": parse_float,
        "default":             parse_bool,
    }
}

# ────────────────────────────────────────────────────────────

TIEMPOS = {
    "sheet":     SHEET_NAMES["TIEMPOS"],
    "rango":     "A2:E200",
    "tabla_pg":  "times",
    "clave_unica": ["serie"],
    "columnas": [
        (0, "serie",            parse_int),
        (1, "hora_entrada",     parse_time_str),
        (2, "completado",       parse_bool),
        (3, "hora_salida_num",  parse_float),
        (4, "hora_entrada_num", parse_float),
    ],
    "campo_calculado": {
        "duracion_dias": lambda row: (
            row["hora_salida_num"] - row["hora_entrada_num"]
            if row.get("hora_salida_num") and row.get("hora_entrada_num")
            else None
        )
    }
}

# ────────────────────────────────────────────────────────────

KPIS = {
    "sheet":    SHEET_NAMES["KPIS"],
    "tabla_pg": "kpis__snapshot",
    "tipo":     "snapshot",   # siempre INSERT, nunca UPSERT

    # (celda_a1, campo_pg, conversion)
    # campo_pg debe ser exactamente el nombre de columna en kpis__snapshot
    # (sync_engine._pull_kpis construye el INSERT dinámicamente con estas keys).
    "celdas": [
        ("B10", "total_buses",                 parse_int),
        ("B11", "buses_needing_workshop",      parse_int),
        ("B12", "released_buses",              parse_int),
        ("B13", "serviced_buses",              parse_int),
        ("B14", "buses_in_bays",               parse_int),
        ("B15", "foreign_buses",               parse_int),
        ("B16", "buses_needing_wash",          parse_int),
        ("B17", "priority_units_completed",    parse_int),
        ("B18", "mechanics_count",             parse_float),
        ("B19", "total_bay_capacity",          parse_float),
        # KPIs calculados (columna D o similar en el sheet)
        ("D1",  "pct_needing_workshop",   parse_float),
        ("D2",  "pct_released",           parse_float),
        ("D3",  "workload_per_mechanic",  parse_float),
        ("D4",  "bay_utilization",        parse_float),
        ("D5",  "foreign_bus_flow",       parse_float),
        ("D6",  "pct_needing_wash",       parse_float),
        ("D7",  "priority_compliance",    parse_float),
    ],
}

# ────────────────────────────────────────────────────────────

PULL_ORDER = [
    ("PLANEACION",      PLANEACION),
    ("CENTRAL",         CENTRAL),
    ("DIESEL",          DIESEL),
    ("ADDBLUE",         ADDBLUE),
    ("TALLER",          TALLER),
    ("DESFOGUE",        DESFOGUE),
    ("LAVADO EXTERIOR", LAVADO_EXTERIOR),
    ("LAVADO INTERIOR", LAVADO_INTERIOR),
    ("TIEMPOS",         TIEMPOS),
    ("KPIS",            KPIS),
]


PUSH_ORDER = [
    ("DIESEL",          DIESEL),
    ("ADDBLUE",         ADDBLUE),
    ("TALLER",          TALLER),
    ("DESFOGUE",        DESFOGUE),
    ("LAVADO EXTERIOR", LAVADO_EXTERIOR),
    ("LAVADO INTERIOR", LAVADO_INTERIOR),
    ("TIEMPOS",         TIEMPOS),
    ("CENTRAL",         CENTRAL),  
]
