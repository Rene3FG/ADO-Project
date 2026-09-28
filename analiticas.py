"""Analíticas del patio: mantenimiento, comparativa día/noche y retraso de salida.

Solo usa movimientos capturados desde la app (last_modified_by='app'): los que
vienen de Sheets son filas de prueba repetidas cada día y con horas ambiguas.

Horas: hasta el 2026-09-27 el servidor escribía en UTC (ver tiempo.py); desde el
28 escribe hora local. Las duraciones no se afectan (entrada y salida comparten
reloj), pero el turno y el retraso se calculan en hora local, así que a las filas
anteriores a HORA_LOCAL_DESDE se les restan 6 h.
"""
from datetime import date
from sqlalchemy import text

HORA_LOCAL_DESDE = date(2026, 9, 28)
DURACION_MAX_MIN = 720      # descarta estancias > 12 h (capturas manuales / huérfanas)
TURNOS = ("Día (06-18)", "Noche (18-06)")

_TIPOS_TALLER = [
    ("tires", "Llantas"), ("preventive_maintenance", "Preventivo"),
    ("alignment_pit", "Fosa / alineación"), ("air_conditioning", "Aire acondicionado"),
    ("transmission_and_brakes", "Transmisión y frenos"), ("engine", "Motor"),
    ("electrical", "Eléctrico"), ("vans", "Camionetas"), ("upholstery", "Vestidura"),
    ("bodywork_peripherals", "Carrocería periféricos"), ("paint_peripherals", "Pintura periféricos"),
    ("paint_pinflo", "Pintura Pinflo"), ("bodywork_pinflo", "Carrocería Pinflo"),
]

# Duración de la estancia y hora local de entrada/salida, base de todas las consultas
_BASE = """
WITH mov AS (
  SELECT m.id, m.serial_number AS serie, m.date AS fecha, m.area_id, a.name AS area,
         m.is_completed AS completado,
         (EXTRACT(EPOCH FROM ((m.exit_time AT TIME ZONE 'UTC') - (m.date + m.entry_time)))/60.0)::float8 AS dur_min,
         (m.date + m.entry_time)
           - CASE WHEN m.date < :corte THEN interval '6 hours' ELSE interval '0' END AS entrada_local,
         (m.exit_time AT TIME ZONE 'UTC')
           - CASE WHEN m.date < :corte THEN interval '6 hours' ELSE interval '0' END AS salida_local
  FROM movements m JOIN area a ON a.id = m.area_id
  WHERE m.last_modified_by = 'app' AND m.date BETWEEN :desde AND :hasta
)
"""


def _turno(ts) -> str:
    return TURNOS[0] if 6 <= ts.hour < 18 else TURNOS[1]


def calcular(conn, desde: date, hasta: date, area_display) -> dict:
    p = {"desde": desde, "hasta": hasta, "corte": HORA_LOCAL_DESDE}
    ok = f"completado AND dur_min IS NOT NULL AND dur_min >= 0 AND dur_min <= {DURACION_MAX_MIN}"

    resumen = conn.execute(text(_BASE + f"""
        SELECT count(*) AS movimientos, count(*) FILTER (WHERE completado) AS completados,
               count(*) FILTER (WHERE {ok}) AS con_duracion, count(DISTINCT fecha) AS dias
        FROM mov"""), p).one()

    # ── Tiempo por área
    por_area = [
        {"area": area_display(r.area), "n": r.n, "promedio_min": round(float(r.prom), 1)}
        for r in conn.execute(text(_BASE + f"""
            SELECT area, count(*) AS n, avg(dur_min) AS prom FROM mov WHERE {ok}
            GROUP BY area ORDER BY area"""), p)
    ]

    # ── Mantenimiento (taller): movimientos y trabajos por semana
    sem_taller = [
        {"semana": r.semana.isoformat(), "n": r.n,
         "promedio_min": round(float(r.prom), 1) if r.prom is not None else None}
        for r in conn.execute(text(_BASE + f"""
            SELECT date_trunc('week', fecha)::date AS semana, count(*) AS n,
                   avg(dur_min) FILTER (WHERE {ok}) AS prom
            FROM mov WHERE area = 'WORKSHOP' GROUP BY 1 ORDER BY 1"""), p)
    ]
    cols = ", ".join(f"count(*) FILTER (WHERE w.{c}) AS {c}" for c, _ in _TIPOS_TALLER)
    fila = conn.execute(text(_BASE + f"""
        SELECT {cols} FROM mov JOIN workshop_details w ON w.movement_id = mov.id
        WHERE mov.area = 'WORKSHOP'"""), p).one()
    tipos = sorted(
        ({"tipo": nombre, "n": int(getattr(fila, c) or 0)} for c, nombre in _TIPOS_TALLER),
        key=lambda t: -t["n"])

    # ── Día vs noche (por hora local de entrada)
    filas = conn.execute(text(_BASE + f"""
        SELECT area, entrada_local, dur_min, completado FROM mov"""), p).all()
    turnos = {t: {"turno": t, "movimientos": 0, "completados": 0, "_d": [], "areas": {}} for t in TURNOS}
    for r in filas:
        t = turnos[_turno(r.entrada_local)]
        t["movimientos"] += 1
        if r.completado:
            t["completados"] += 1
        if r.completado and r.dur_min is not None and 0 <= r.dur_min <= DURACION_MAX_MIN:
            t["_d"].append(r.dur_min)
            t["areas"].setdefault(area_display(r.area), []).append(r.dur_min)
    for t in turnos.values():
        d = t.pop("_d")
        t["promedio_min"] = round(sum(d) / len(d), 1) if d else None
        t["areas"] = [{"area": a, "n": len(v), "promedio_min": round(sum(v) / len(v), 1)}
                      for a, v in sorted(t["areas"].items())]

    # ── Retraso: salida programada vs fin del último servicio requerido
    viajes = conn.execute(text(_BASE + """
        , fin AS (
          SELECT serie, fecha, count(DISTINCT area_id) FILTER (WHERE completado) AS hechas,
                 max(salida_local) FILTER (WHERE completado) AS fin_local
          FROM mov GROUP BY serie, fecha)
        SELECT f.serie, f.fecha, t.departure_time AS salida_prog, f.hechas, f.fin_local,
               ((t.needs_drainage > 0)::int + (t.needs_diesel > 0)::int + (t.needs_adblue > 0)::int
                + (t.needs_ext_wash > 0)::int + (t.needs_int_wash > 0)::int
                + (t.needs_workshop > 0)::int) AS requeridas
        FROM fin f JOIN trips t ON t.serial_number = f.serie AND t.date = f.fecha
        WHERE t.departure_time IS NOT NULL AND f.fin_local IS NOT NULL"""), p).all()
    detalle, por_dia = [], {}
    for v in viajes:
        if v.requeridas is None or v.hechas < v.requeridas:
            continue            # aún no termina todos sus servicios: no hay retraso que medir
        prog = _combinar(v.fecha, v.salida_prog)
        retraso = (v.fin_local - prog).total_seconds() / 60.0
        detalle.append({"serie": v.serie, "fecha": v.fecha.isoformat(),
                        "salida_programada": v.salida_prog.strftime("%H:%M"),
                        "fin_servicios": v.fin_local.strftime("%H:%M"),
                        "retraso_min": round(retraso, 1)})
        d = por_dia.setdefault(v.fecha.isoformat(), {"fecha": v.fecha.isoformat(), "viajes": 0,
                                                     "con_retraso": 0, "_r": []})
        d["viajes"] += 1
        if retraso > 0:
            d["con_retraso"] += 1
            d["_r"].append(retraso)
    for d in por_dia.values():
        r = d.pop("_r")
        d["retraso_promedio_min"] = round(sum(r) / len(r), 1) if r else 0.0
    detalle.sort(key=lambda x: -x["retraso_min"])

    return {
        "desde": desde.isoformat(), "hasta": hasta.isoformat(),
        "muestra": {"movimientos": resumen.movimientos, "completados": resumen.completados,
                    "con_duracion": resumen.con_duracion, "dias": resumen.dias,
                    "suficiente": resumen.con_duracion >= 30},
        "por_area": por_area,
        "mantenimiento": {"por_semana": sem_taller, "por_tipo": tipos},
        "turnos": list(turnos.values()),
        "retraso": {"viajes_medidos": len(detalle),
                    "con_retraso": sum(1 for x in detalle if x["retraso_min"] > 0),
                    "por_dia": sorted(por_dia.values(), key=lambda x: x["fecha"]),
                    "peores": detalle[:10]},
    }


def _combinar(fecha, hora):
    from datetime import datetime
    return datetime.combine(fecha, hora)
