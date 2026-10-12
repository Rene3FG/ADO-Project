"""Herramientas de solo lectura del asistente de chat.

Reglas de seguridad (se aplican aquí, en el servidor, nunca en el modelo):
- El alcance (`alcance_area`) sale del usuario autenticado: str (nombre en BD) para
  Operador, None para Administrador/Supervisor.
- Para Operador el argumento `area` se sobrescribe siempre con su área.
- Solo SELECT parametrizados; los nombres de columna salen de listas fijas.
- Se devuelve el mínimo de columnas: sin conductor, terminales, notas ni nombres.
"""
from datetime import date
from typing import Callable, Optional

from sqlalchemy import text

from tiempo import hoy

MAX_FILAS = 50

# nombre en BD -> columna de `trips` que indica que la corrida requiere esa área
_NEEDS_COL = {
    "DIESEL": "needs_diesel",
    "ADDBLUE": "needs_adblue",
    "WORKSHOP": "needs_workshop",
    "DRAINAGE": "needs_drainage",
    "EXTERIOR WASH": "needs_ext_wash",
    "INTERIOR WASH": "needs_int_wash",
    "RECEPTION": "needs_reception",
}

_FECHA = {"type": "string", "description": "YYYY-MM-DD; por defecto hoy"}
_AREA = {"type": "string", "description":
         "Área: Diesel, Ad-Blue, Taller, Desfogue, Lavado Exterior, Lavado Interior o Descanso"}
_TURNO = {"type": "integer", "description": "Número de turno (1, 2, 3...)"}

DECLARACIONES = [
    {"name": "get_corridas",
     "description": "Corridas programadas del día con hora, tipo de unidad y áreas que requieren.",
     "parameters": {"type": "object", "properties": {
         "area": _AREA, "turno": _TURNO, "fecha": _FECHA}}},
    {"name": "get_estado_area",
     "description": "Estado de un área (p. ej. Desfogue): capacidad, ocupación y camiones presentes. "
                    "Sin área devuelve la ocupación de todas las áreas.",
     "parameters": {"type": "object", "properties": {"area": _AREA, "fecha": _FECHA}}},
    {"name": "get_resumen_turno",
     "description": "Resumen de un turno: movimientos totales, completados y tiempo promedio por área.",
     "parameters": {"type": "object", "properties": {
         "area": _AREA, "turno": _TURNO, "fecha": _FECHA}}},
    {"name": "get_kpis",
     "description": "Último snapshot de KPIs generales del patio (solo Administrador/Supervisor).",
     "parameters": {"type": "object", "properties": {}}},
]


class Contexto:
    """Todo lo que una herramienta necesita; construido por el servidor por petición."""
    def __init__(self, db: Callable, display_a_bd: dict, bd_a_display: dict,
                 alcance_area: Optional[str]):
        self.db = db
        self.display_a_bd = display_a_bd
        self.bd_a_display = bd_a_display
        self.alcance_area = alcance_area          # nombre BD o None (sin restricción)

    def disp(self, nombre_bd):
        return self.bd_a_display.get(nombre_bd, nombre_bd)

    def resolver_area(self, solicitada):
        """Devuelve (area_bd|None, aviso|None, error|None)."""
        if self.alcance_area:
            aviso = None
            if solicitada and self.display_a_bd.get(solicitada, solicitada) != self.alcance_area:
                aviso = (f"Solo tienes acceso a tu área ({self.disp(self.alcance_area)}); "
                         "los datos mostrados son de esa área.")
            return self.alcance_area, aviso, None
        if not solicitada:
            return None, None, None
        bd = self.display_a_bd.get(solicitada, solicitada)
        if bd not in _NEEDS_COL:
            return None, None, f"Área desconocida: {solicitada}"
        return bd, None, None


def _fecha(valor):
    if not valor:
        return hoy(), None
    try:
        return date.fromisoformat(str(valor)), None
    except ValueError:
        return None, "Fecha inválida, usa YYYY-MM-DD"


def _turno(valor):
    if valor in (None, ""):
        return None, None
    try:
        t = int(valor)
    except (TypeError, ValueError):
        return None, "Turno inválido"
    return (t, None) if 0 < t < 10 else (None, "Turno inválido")


def _hora(v):
    return v.strftime("%H:%M") if v else None


def _con_aviso(res, aviso):
    if aviso:
        res["aviso"] = aviso
    return res


def get_corridas(ctx: Contexto, area=None, turno=None, fecha=None):
    f, err = _fecha(fecha)
    t, err2 = _turno(turno)
    if err or err2:
        return {"error": err or err2}
    area_bd, aviso, err = ctx.resolver_area(area)
    if err:
        return {"error": err}
    q = ("SELECT t.serial_number, bt.name AS tipo, r.shift, t.scheduled_time, t.departure_time, "
         + ", ".join(f"t.{c}" for c in _NEEDS_COL.values()) +
         " FROM trips t LEFT JOIN bus_types bt ON bt.id = t.type_id"
         " LEFT JOIN records r ON r.serial_number = t.serial_number AND r.date = t.date"
         " WHERE t.date = :f")
    p = {"f": f, "lim": MAX_FILAS}
    if t is not None:
        q += " AND r.shift = :t"
        p["t"] = t
    if area_bd:
        q += f" AND COALESCE(t.{_NEEDS_COL[area_bd]}, 0) <> 0"   # columna de lista fija
    q += " ORDER BY t.scheduled_time NULLS LAST, t.serial_number LIMIT :lim"
    with ctx.db() as conn:
        rows = conn.execute(text(q), p).fetchall()
    corridas = [{
        "serie": r.serial_number, "tipo": r.tipo, "turno": r.shift,
        "hora_corrida": _hora(r.scheduled_time), "hora_salida": _hora(r.departure_time),
        "requiere": [ctx.disp(a) for a, c in _NEEDS_COL.items() if getattr(r, c)],
    } for r in rows]
    return _con_aviso({"fecha": str(f), "total": len(corridas), "corridas": corridas}, aviso)


_ULTIMO_MOV = (
    "SELECT DISTINCT ON (m.serial_number) m.serial_number, a.name AS area, a.capacity,"
    " m.entry_time, m.is_completed, r.progress, r.shift"
    " FROM movements m JOIN area a ON a.id = m.area_id"
    " JOIN records r ON r.serial_number = m.serial_number AND r.date = :f AND r.is_active = true"
    " ORDER BY m.serial_number, m.id DESC"
)


def get_estado_area(ctx: Contexto, area=None, fecha=None):
    f, err = _fecha(fecha)
    if err:
        return {"error": err}
    area_bd, aviso, err = ctx.resolver_area(area)
    if err:
        return {"error": err}
    with ctx.db() as conn:
        rows = conn.execute(text(_ULTIMO_MOV), {"f": f}).fetchall()
        caps = conn.execute(text("SELECT name, capacity FROM area")).fetchall()
    capacidad = {c.name: c.capacity for c in caps}
    presentes = [r for r in rows if not r.is_completed]
    if area_bd is None:
        out = []
        for nombre, cap in sorted(capacidad.items()):
            ocup = sum(1 for r in presentes if r.area == nombre)
            out.append({"area": ctx.disp(nombre), "capacidad": cap, "ocupados": ocup})
        return {"fecha": str(f), "areas": out}
    en_area = [r for r in presentes if r.area == area_bd][:MAX_FILAS]
    cap = capacidad.get(area_bd)
    return _con_aviso({
        "fecha": str(f), "area": ctx.disp(area_bd), "capacidad": cap,
        "ocupados": len(en_area),
        "disponibles": None if cap is None else max(cap - len(en_area), 0),
        "camiones": [{"serie": r.serial_number, "hora_entrada": _hora(r.entry_time),
                      "avance": float(r.progress) if r.progress is not None else None,
                      "turno": r.shift} for r in en_area],
    }, aviso)


def get_resumen_turno(ctx: Contexto, area=None, turno=None, fecha=None):
    f, err = _fecha(fecha)
    t, err2 = _turno(turno)
    if err or err2:
        return {"error": err or err2}
    area_bd, aviso, err = ctx.resolver_area(area)
    if err:
        return {"error": err}
    q = ("SELECT a.name AS area, COUNT(*) AS total,"
         " COUNT(*) FILTER (WHERE m.is_completed) AS completados,"
         " AVG(m.duration_days) FILTER (WHERE m.is_completed AND m.duration_days > 0) AS prom_dias"
         " FROM movements m JOIN area a ON a.id = m.area_id"
         " JOIN records r ON r.id = m.record_id WHERE m.date = :f")
    p = {"f": f}
    if t is not None:
        q += " AND r.shift = :t"
        p["t"] = t
    if area_bd:
        q += " AND a.name = :a"
        p["a"] = area_bd
    q += " GROUP BY a.name ORDER BY a.name"
    with ctx.db() as conn:
        rows = conn.execute(text(q), p).fetchall()
    return _con_aviso({
        "fecha": str(f), "turno": t,
        "areas": [{"area": ctx.disp(r.area), "movimientos": r.total,
                   "completados": r.completados, "pendientes": r.total - r.completados,
                   "minutos_promedio": round(float(r.prom_dias) * 1440)
                   if r.prom_dias is not None else None} for r in rows],
    }, aviso)


def get_kpis(ctx: Contexto):
    if ctx.alcance_area:
        return {"error": "Sin permiso: los KPIs generales son solo para Administrador/Supervisor."}
    with ctx.db() as conn:
        r = conn.execute(text(
            "SELECT captured_at, total_buses, buses_needing_workshop, released_buses,"
            " serviced_buses, buses_in_bays, foreign_buses, buses_needing_wash,"
            " bay_utilization, priority_compliance FROM kpis__snapshot ORDER BY id DESC LIMIT 1"
        )).fetchone()
    if not r:
        return {"error": "No hay KPIs todavía"}
    return {"capturado": str(r.captured_at), "camiones_total": r.total_buses,
            "necesitan_taller": r.buses_needing_workshop, "liberados": r.released_buses,
            "atendidos": r.serviced_buses, "en_andenes": r.buses_in_bays,
            "foraneos": r.foreign_buses, "necesitan_lavado": r.buses_needing_wash,
            "utilizacion_andenes": float(r.bay_utilization) if r.bay_utilization is not None else None,
            "cumplimiento_prioridad": float(r.priority_compliance)
            if r.priority_compliance is not None else None}


HERRAMIENTAS = {
    "get_corridas": get_corridas,
    "get_estado_area": get_estado_area,
    "get_resumen_turno": get_resumen_turno,
    "get_kpis": get_kpis,
}


def ejecutar(ctx: Contexto, nombre: str, args: dict):
    """Ejecuta una herramienta pedida por el modelo. Nunca lanza: devuelve {'error'}."""
    fn = HERRAMIENTAS.get(nombre)
    if not fn:
        return {"error": "Herramienta desconocida"}
    permitidos = {p for d in DECLARACIONES if d["name"] == nombre
                  for p in d["parameters"]["properties"]}
    limpio = {k: v for k, v in (args or {}).items() if k in permitidos}
    try:
        return fn(ctx, **limpio)
    except Exception:
        return {"error": "No se pudo consultar ese dato"}
