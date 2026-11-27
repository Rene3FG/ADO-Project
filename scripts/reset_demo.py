"""Deja la demo NFC lista para empezar (idempotente, se puede correr N veces).

    python scripts/reset_demo.py                # base local de la demo (Docker)
    python scripts/reset_demo.py --produccion   # base de producción (Render/Supabase)

Ambos modos: ADO-101 y ADO-102 registradas HOY, cada una con su ruta de
checkin.RUTAS_DEMO, paradas en Desfogue (estado inicial). Solo se tocan filas de
esas 2 unidades; en producción se aborta si alguna tiene datos que no sean de
la demo (notes <> 'DEMO NFC').

Solo local: además siembra catálogos y usuarios de prueba (admin, op_*) con
contraseña DEMO_PASSWORD. Sin --produccion se niega a correr contra una base
que no sea localhost.
"""
import os
import sys
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from checkin import RUTA_CORTA, RUTAS_DEMO, registrar_unidad_demo  # noqa: E402
from config import DATABASE_URL  # noqa: E402
from tiempo import hoy  # noqa: E402

UNIDADES = [101, 102]
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "demo2026")

AREAS = [(1, "DIESEL", 3), (2, "ADDBLUE", 2), (3, "WORKSHOP", 2), (4, "DRAINAGE", 4),
         (5, "EXTERIOR WASH", 4), (6, "INTERIOR WASH", 3)]
TIPOS = [(1, "AU"), (2, "SUR"), (3, "TXO"), (5, "ADO"), (7, "OCC"), (8, "LUJO")]
ROLES = [(1, "Administrator"), (2, "Supervisor"), (3, "Operator")]
# username, rol_id, nombre, apellido, área asignada (id) o None
USUARIOS = [
    ("admin", 1, "Admin", "Demo", None),
    ("op_desfogue", 3, "Operador", "Desfogue", 4),
    ("op_diesel", 3, "Operador", "Diesel", 1),
    ("op_adblue", 3, "Operador", "AdBlue", 2),
    ("op_taller", 3, "Operador", "Taller", 3),
    ("op_lav_int", 3, "Operador", "LavInt", 6),
    ("op_lav_ext", 3, "Operador", "LavExt", 5),
]


def _sembrar_local(c) -> None:
    for i, n, cap in AREAS:
        c.execute(text("INSERT INTO area (id, name, capacity) VALUES (:i,:n,:c)"
                       " ON CONFLICT (id) DO NOTHING"), {"i": i, "n": n, "c": cap})
    for i, n in TIPOS:
        c.execute(text("INSERT INTO bus_types (id, name) VALUES (:i,:n) ON CONFLICT (id) DO NOTHING"),
                  {"i": i, "n": n})
    for i, n in ROLES:
        c.execute(text("INSERT INTO roles (id, name) VALUES (:i,:n) ON CONFLICT (id) DO NOTHING"),
                  {"i": i, "n": n})
    for tabla in ("area", "bus_types", "roles"):
        c.execute(text(f"SELECT setval(pg_get_serial_sequence('{tabla}','id'),"
                       f" (SELECT MAX(id) FROM {tabla}))"))

    pw = bcrypt.hashpw(DEMO_PASSWORD.encode(), bcrypt.gensalt()).decode()
    for u, rol, nom, ape, area in USUARIOS:
        c.execute(text("""
            INSERT INTO users (username, role_id, password_hash, first_name, last_name, assigned_area_id)
            VALUES (:u, :r, :p, :n, :a, :area)
            ON CONFLICT (username) DO UPDATE SET role_id=EXCLUDED.role_id,
                password_hash=EXCLUDED.password_hash, assigned_area_id=EXCLUDED.assigned_area_id,
                is_active=true
        """), {"u": u, "r": rol, "p": pw, "n": nom, "a": ape, "area": area})


def main() -> None:
    produccion = "--produccion" in sys.argv
    host = urlparse(DATABASE_URL).hostname or ""
    if host not in ("localhost", "127.0.0.1") and not produccion:
        sys.exit(f"Abortado: DATABASE_URL apunta a '{host}'. Usa --produccion si es a propósito.")

    engine = create_engine(DATABASE_URL)
    f = hoy()
    with engine.begin() as c:
        if produccion:
            ajenos = c.execute(text(
                "SELECT serial_number, date FROM trips WHERE serial_number = ANY(:u)"
                " AND notes IS DISTINCT FROM 'DEMO NFC' LIMIT 5"), {"u": UNIDADES}).fetchall()
            if ajenos:
                sys.exit(f"Abortado: hay viajes reales con esas series: {ajenos}")
        else:
            _sembrar_local(c)

        drenaje = c.execute(text("SELECT id FROM area WHERE name='DRAINAGE'")).scalar()
        for serie in UNIDADES:
            c.execute(text("DELETE FROM movements WHERE serial_number=:s"), {"s": serie})
            c.execute(text("DELETE FROM area_checklists WHERE record_id IN"
                           " (SELECT id FROM records WHERE serial_number=:s)"), {"s": serie})
            c.execute(text("DELETE FROM records WHERE serial_number=:s AND date<>:f"), {"s": serie, "f": f})
            c.execute(text("DELETE FROM trips WHERE serial_number=:s AND date<>:f"), {"s": serie, "f": f})
            registrar_unidad_demo(c, serie, drenaje)

    print(f"Demo lista ({f}, base {host}): ADO-101 y ADO-102 en Desfogue.")
    for serie in UNIDADES:
        print(f"  ADO-{serie}: {' → '.join(RUTAS_DEMO.get(serie, RUTA_CORTA))} → Salida")
    if not produccion:
        print(f"Usuarios {', '.join(u[0] for u in USUARIOS)} / contraseña {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
