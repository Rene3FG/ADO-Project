"""Datos de DEMOSTRACIÓN para las analíticas (no son datos reales).

  python scripts/demo_analiticas.py           # crea ~29 días de datos demo
  python scripts/demo_analiticas.py --borrar  # los elimina (series 990000-990999)

Todo lo demo usa series 990000-990999 (trips.notes = 'DEMO ANALITICAS'), queda
marcado last_modified_by='app', is_dirty=false y sin sheets_row, así que el sync
no lo sube al Sheet. Convención de horas de la base (ver tiempo.py / analiticas.py):
las fechas anteriores al 2026-09-28 guardan hora UTC (local + 6 h), por eso los
ingresos de la tarde-noche se evitan (cruzarían la medianoche UTC).
"""
import os
import random
import sys
from datetime import date, datetime, time, timedelta

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
engine = create_engine(os.environ["DATABASE_URL"])

SERIE_MIN, SERIE_MAX = 990000, 990999
CORTE = date(2026, 9, 28)
DESDE, HASTA = date(2026, 8, 30), date(2026, 9, 27)

# (area_id, campo needs_*, duración media en min, desviación) — ids de la tabla `area`
AREAS = {
    "DRAINAGE": (4, "needs_drainage", 9, 3),
    "DIESEL": (1, "needs_diesel", 14, 4),
    "ADDBLUE": (2, "needs_adblue", 7, 2),
    "WORKSHOP": (3, "needs_workshop", 110, 45),
    "EXTERIOR WASH": (5, "needs_ext_wash", 22, 6),
    "INTERIOR WASH": (6, "needs_int_wash", 24, 7),
}
ORDEN = ["DRAINAGE", "DIESEL", "ADDBLUE", "WORKSHOP", "EXTERIOR WASH", "INTERIOR WASH"]
TRABAJOS = ["tires", "preventive_maintenance", "alignment_pit", "air_conditioning",
            "transmission_and_brakes", "engine", "electrical", "vans", "upholstery",
            "bodywork_peripherals", "paint_peripherals", "paint_pinflo", "bodywork_pinflo"]
TIPOS = [1, 2, 3, 5, 7, 8]


def borrar(conn):
    p = {"a": SERIE_MIN, "b": SERIE_MAX}
    for t, w in [
        ("workshop_details", "movement_id IN (SELECT id FROM movements WHERE serial_number BETWEEN :a AND :b)"),
        ("area_checklists", "record_id IN (SELECT id FROM records WHERE serial_number BETWEEN :a AND :b)"),
        ("movements", "serial_number BETWEEN :a AND :b"),
        ("records", "serial_number BETWEEN :a AND :b"),
        ("trips", "serial_number BETWEEN :a AND :b"),
    ]:
        print(f"borradas {t}: {conn.execute(text(f'DELETE FROM {t} WHERE {w}'), p).rowcount}")


def _pesos_trabajo(dia_idx, total_dias):
    """Tendencia: llantas/preventivo bajan con el tiempo; aire acondicionado y eléctrico suben."""
    f = dia_idx / max(1, total_dias - 1)
    return {"tires": 0.75 - 0.35 * f, "preventive_maintenance": 0.7 - 0.25 * f,
            "alignment_pit": 0.35, "air_conditioning": 0.15 + 0.5 * f, "engine": 0.25,
            "transmission_and_brakes": 0.3, "electrical": 0.12 + 0.4 * f, "vans": 0.05,
            "upholstery": 0.1, "bodywork_peripherals": 0.2, "paint_peripherals": 0.08,
            "paint_pinflo": 0.06, "bodywork_pinflo": 0.07}


def _plan_viaje(rng, dia_idx, total_dias):
    """Devuelve (hora_local_inicio, pasos[(area, entrada, salida)]) con todas las entradas < 18:00."""
    n = rng.choice([2, 3, 3, 4])
    hay_taller = rng.random() < 0.3
    elegidas = set(rng.sample([a for a in ORDEN if a != "WORKSHOP"], n - (1 if hay_taller else 0)))
    if hay_taller:
        elegidas.add("WORKSHOP")
    noche = rng.random() < 0.3
    while True:
        inicio = (timedelta(hours=rng.uniform(0, 4.5)) if noche
                  else timedelta(hours=rng.uniform(6, 14)))
        t, pasos = inicio, []
        for area in [a for a in ORDEN if a in elegidas]:
            _, _, media, sd = AREAS[area]
            dur = max(2.0, rng.gauss(media * (1.3 if noche else 1.0), sd))   # noche ~30 % más lenta
            pasos.append((area, t, t + timedelta(minutes=dur)))
            t += timedelta(minutes=dur + rng.uniform(2, 10))
        if all(p[1] < timedelta(hours=18) for p in pasos):
            return noche, pasos


def crear(conn):
    rng = random.Random(20260928)
    dias = [DESDE + timedelta(days=i) for i in range((HASTA - DESDE).days + 1)]
    total = ok_mov = 0
    for idx, d in enumerate(dias):
        peso = _pesos_trabajo(idx, len(dias))
        for k in range(rng.randint(6, 9)):
            serie = SERIE_MIN + 1 + k
            noche, pasos = _plan_viaje(rng, idx, len(dias))
            medianoche = datetime.combine(d, time(0, 0))
            corrimiento = timedelta(hours=6) if d < CORTE else timedelta()   # UTC antes del corte
            fin = pasos[-1][2]
            salida_prog = fin + timedelta(minutes=rng.gauss(-5, 35))         # ~45 % con retraso
            salida_prog = max(salida_prog, pasos[-1][1] + timedelta(minutes=1))
            tipo = rng.choice(TIPOS)
            needs = {c: 0 for _, c, _, _ in AREAS.values()}
            for area, _, _ in pasos:
                needs[AREAS[area][1]] = 1
            conn.execute(text(
                "INSERT INTO trips (date, serial_number, type_id, departure_time, needs_reception,"
                " needs_drainage, needs_diesel, needs_adblue, needs_ext_wash, needs_int_wash,"
                " needs_workshop, is_dirty, last_modified_by, driver_name, origin_terminal,"
                " destination_terminal, notes)"
                " VALUES (:d,:s,:t,:dep,0,:needs_drainage,:needs_diesel,:needs_adblue,:needs_ext_wash,"
                " :needs_int_wash,:needs_workshop,false,'app','DEMO Conductor','CDMX TAPO','Oaxaca Centro',"
                " 'DEMO ANALITICAS')"),
                {"d": d, "s": serie, "t": tipo, "dep": (medianoche + salida_prog).time(), **needs})
            reg_ts = medianoche + pasos[0][1] + corrimiento
            rid = conn.execute(text(
                "INSERT INTO records (date, serial_number, type_id, is_active, registration_time,"
                " progress, is_dirty, last_modified_by)"
                " VALUES (:d,:s,:t,false,:ts,100,false,'app') RETURNING id"),
                {"d": d, "s": serie, "t": tipo, "ts": reg_ts.isoformat() + "+00"}).scalar()
            for area, ent, sal in pasos:
                area_id = AREAS[area][0]
                entrada = medianoche + ent + corrimiento
                salida = medianoche + sal + corrimiento
                mid = conn.execute(text(
                    "INSERT INTO movements (record_id, area_id, serial_number, date, entry_time, exit_time,"
                    " is_completed, is_dirty, last_modified_by)"
                    " VALUES (:r,:a,:s,:d,:et,:xt,true,false,'app') RETURNING id"),
                    {"r": rid, "a": area_id, "s": serie, "d": d, "et": entrada.time(),
                     "xt": salida.isoformat() + "+00"}).scalar()
                ok_mov += 1
                if area == "WORKSHOP":
                    marcas = {c: rng.random() < peso[c] for c in TRABAJOS}
                    if not any(marcas.values()):
                        marcas["preventive_maintenance"] = True
                    cols = ", ".join(TRABAJOS)
                    vals = ", ".join(f":{c}" for c in TRABAJOS)
                    conn.execute(text(
                        f"INSERT INTO workshop_details (movement_id, {cols}, progress_percentage)"
                        f" VALUES (:m, {vals}, 100)"), {"m": mid, **marcas})
            total += 1
    print(f"creados {total} viajes y {ok_mov} movimientos demo ({DESDE} a {HASTA})")


if __name__ == "__main__":
    with engine.begin() as conn:
        if "--borrar" in sys.argv:
            borrar(conn)
        else:
            if conn.execute(text("SELECT count(*) FROM trips WHERE serial_number BETWEEN :a AND :b"),
                            {"a": SERIE_MIN, "b": SERIE_MAX}).scalar():
                sys.exit("Ya hay datos demo: corre con --borrar antes de volver a crearlos.")
            crear(conn)
