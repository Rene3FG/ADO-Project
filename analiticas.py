"""Analíticas del patio: mantenimiento, comparativa día/noche y retraso de salida.

Las consultas SQL solo traen filas crudas; todo el cálculo (columnas derivadas,
agrupaciones, cuantiles, semanas) se hace con pandas/numpy sobre DataFrames.

Solo usa movimientos capturados desde la app (last_modified_by='app'): los que
vienen de Sheets son filas de prueba repetidas cada día y con horas ambiguas.

Horas: hasta el 2026-09-27 el servidor escribía en UTC (ver tiempo.py); desde el
28 escribe hora local. Las duraciones no se afectan (entrada y salida comparten
reloj), pero el turno y el retraso se calculan en hora local, así que a las filas
anteriores a HORA_LOCAL_DESDE se les restan 6 h.
"""
from datetime import date

import numpy as np
import pandas as pd
from sqlalchemy import text

HORA_LOCAL_DESDE = date(2026, 9, 28)
DURACION_MAX_MIN = 720      # descarta estancias > 12 h (capturas manuales / huérfanas)
MUESTRA_MINIMA = 30         # movimientos con duración para considerar confiables las cifras
TURNOS = ("Día (06-18)", "Noche (18-06)")

_TIPOS_TALLER = {
    "tires": "Llantas", "preventive_maintenance": "Preventivo",
    "alignment_pit": "Fosa / alineación", "air_conditioning": "Aire acondicionado",
    "transmission_and_brakes": "Transmisión y frenos", "engine": "Motor",
    "electrical": "Eléctrico", "vans": "Camionetas", "upholstery": "Vestidura",
    "bodywork_peripherals": "Carrocería periféricos", "paint_peripherals": "Pintura periféricos",
    "paint_pinflo": "Pintura Pinflo", "bodywork_pinflo": "Carrocería Pinflo",
}
_NEEDS = ["needs_drainage", "needs_diesel", "needs_adblue", "needs_ext_wash",
          "needs_int_wash", "needs_workshop"]


def _num(x, nd: int = 1):
    """float redondeado para JSON; NaN/None → None."""
    return None if x is None or pd.isna(x) else round(float(x), nd)


def _resumen_duraciones(serie: pd.Series) -> dict:
    """n, promedio, mediana y p90 de una serie de minutos (la mediana no se deja
    arrastrar por estancias raras; el p90 muestra el peor caso habitual)."""
    return {"n": int(serie.size), "promedio_min": _num(serie.mean()),
            "mediana_min": _num(serie.median()), "p90_min": _num(serie.quantile(0.9))}


def _movimientos(conn, p: dict) -> pd.DataFrame:
    """Movimientos de la app con columnas derivadas: duración y hora local de entrada/salida."""
    df = pd.read_sql(text("""
        SELECT m.id, m.serial_number AS serie, m.date AS fecha, a.name AS area, m.area_id,
               m.is_completed AS completado,
               EXTRACT(EPOCH FROM m.entry_time)::float8 AS entrada_seg,
               (m.exit_time AT TIME ZONE 'UTC') AS salida_raw
        FROM movements m JOIN area a ON a.id = m.area_id
        WHERE m.last_modified_by = 'app' AND m.date BETWEEN :desde AND :hasta"""),
        conn, params=p)
    df["fecha"] = pd.to_datetime(df["fecha"])
    df["salida_raw"] = pd.to_datetime(df["salida_raw"])
    entrada_raw = df["fecha"] + pd.to_timedelta(df["entrada_seg"], unit="s")
    df["dur_min"] = (df["salida_raw"] - entrada_raw).dt.total_seconds() / 60.0
    # UTC → local solo para filas anteriores al corte
    corr = pd.to_timedelta(np.where(df["fecha"] < pd.Timestamp(HORA_LOCAL_DESDE), 6, 0), unit="h")
    df["entrada_local"] = entrada_raw - corr
    df["salida_local"] = df["salida_raw"] - corr
    df["valido"] = df["completado"] & df["dur_min"].between(0, DURACION_MAX_MIN)
    hora = df["entrada_local"].dt.hour
    df["turno"] = np.where((hora >= 6) & (hora < 18), TURNOS[0], TURNOS[1])
    return df


def _mantenimiento(conn, mov: pd.DataFrame, p: dict) -> dict:
    taller = mov[mov["area"] == "WORKSHOP"].copy()

    # Unidades por semana (lunes), con las semanas sin actividad en 0 para que la tendencia sea continua
    taller["semana"] = taller["fecha"] - pd.to_timedelta(taller["fecha"].dt.weekday, unit="D")
    taller["dur_valida"] = taller["dur_min"].where(taller["valido"])
    por_semana = taller.groupby("semana").agg(n=("id", "size"), prom=("dur_valida", "mean"))
    if not por_semana.empty:
        por_semana = por_semana.reindex(pd.date_range(por_semana.index.min(), por_semana.index.max(),
                                                      freq="7D", name="semana"))
        por_semana["n"] = por_semana["n"].fillna(0).astype(int)
    semanas = [{"semana": s.date().isoformat(), "n": int(r.n), "promedio_min": _num(r.prom)}
               for s, r in por_semana.iterrows()]

    # Frecuencia de cada tipo de trabajo de taller
    ids = taller["id"].tolist()
    if ids:
        det = pd.read_sql(text(f"SELECT {', '.join(_TIPOS_TALLER)} FROM workshop_details"
                               " WHERE movement_id = ANY(:ids)"), conn, params={"ids": ids})
        conteo = det.fillna(False).astype(bool).sum()
    else:
        conteo = pd.Series(0, index=list(_TIPOS_TALLER))
    tipos = (conteo.rename(index=_TIPOS_TALLER).astype(int)
             .rename_axis("tipo").reset_index(name="n")
             .sort_values("n", ascending=False, kind="stable").to_dict("records"))
    return {"por_semana": semanas, "por_tipo": tipos}


def _turnos(mov: pd.DataFrame, area_display) -> list:
    salida = []
    for turno in TURNOS:
        t = mov[mov["turno"] == turno]
        v = t[t["valido"]]
        areas = [{"area": area_display(area), **_resumen_duraciones(g["dur_min"])}
                 for area, g in v.groupby("area", sort=True)]
        salida.append({
            "turno": turno, "movimientos": int(len(t)), "completados": int(t["completado"].sum()),
            "promedio_min": _num(v["dur_min"].mean()),
            "mediana_min": _num(v["dur_min"].median()),
            "areas": sorted(areas, key=lambda a: a["area"]),
        })
    return salida


def _retraso(conn, mov: pd.DataFrame, p: dict) -> dict:
    """Salida programada vs fin del último servicio, solo de viajes con todos sus servicios completos."""
    hechos = mov[mov["completado"]]
    fin = (hechos.groupby(["serie", "fecha"])
           .agg(hechas=("area_id", "nunique"), fin_local=("salida_local", "max")).reset_index())
    trips = pd.read_sql(text(f"""
        SELECT serial_number AS serie, date AS fecha, departure_time, {', '.join(_NEEDS)}
        FROM trips WHERE date BETWEEN :desde AND :hasta AND departure_time IS NOT NULL"""),
        conn, params=p)
    trips["fecha"] = pd.to_datetime(trips["fecha"])
    v = fin.merge(trips, on=["serie", "fecha"], how="inner")
    v = v[v["fin_local"].notna()]
    v["requeridas"] = (v[_NEEDS].fillna(0) > 0).sum(axis=1)
    v = v[v["hechas"] >= v["requeridas"]].copy()

    prog = v["fecha"] + pd.to_timedelta(v["departure_time"].astype(str))
    v["retraso_min"] = (v["fin_local"] - prog).dt.total_seconds() / 60.0
    v["tarde"] = v["retraso_min"] > 0

    por_dia = (v.groupby("fecha")
               .agg(viajes=("serie", "size"), con_retraso=("tarde", "sum"),
                    retraso_promedio_min=("retraso_min", lambda s: s[s > 0].mean()))
               .fillna({"retraso_promedio_min": 0.0}).reset_index())
    dias = [{"fecha": r.fecha.date().isoformat(), "viajes": int(r.viajes),
             "con_retraso": int(r.con_retraso), "retraso_promedio_min": _num(r.retraso_promedio_min)}
            for r in por_dia.itertuples()]

    peores = v.nlargest(10, "retraso_min")
    detalle = [{"serie": int(r.serie), "fecha": r.fecha.date().isoformat(),
                "salida_programada": str(r.departure_time)[:5],
                "fin_servicios": r.fin_local.strftime("%H:%M"),
                "retraso_min": _num(r.retraso_min)} for r in peores.itertuples()]
    tarde = v.loc[v["tarde"], "retraso_min"]
    return {"viajes_medidos": int(len(v)), "con_retraso": int(v["tarde"].sum()),
            "mediana_retraso_min": _num(tarde.median()) if not tarde.empty else None,
            "p90_retraso_min": _num(tarde.quantile(0.9)) if not tarde.empty else None,
            "por_dia": dias, "peores": detalle}


def calcular(conn, desde: date, hasta: date, area_display) -> dict:
    p = {"desde": desde, "hasta": hasta}
    mov = _movimientos(conn, p)
    valido = mov[mov["valido"]]
    por_area = [{"area": area_display(area), **_resumen_duraciones(g["dur_min"])}
                for area, g in valido.groupby("area", sort=True)]
    con_duracion = int(len(valido))

    return {
        "desde": desde.isoformat(), "hasta": hasta.isoformat(),
        "muestra": {"movimientos": int(len(mov)), "completados": int(mov["completado"].sum()),
                    "con_duracion": con_duracion, "dias": int(mov["fecha"].nunique()),
                    "suficiente": con_duracion >= MUESTRA_MINIMA},
        "por_area": sorted(por_area, key=lambda a: a["area"]),
        "mantenimiento": _mantenimiento(conn, mov, p),
        "turnos": _turnos(mov, area_display),
        "retraso": _retraso(conn, mov, p),
    }
