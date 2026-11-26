"""Deja la demo NFC lista para empezar (idempotente, se puede correr N veces).

    python scripts/reset_demo.py

- Catálogos (áreas, tipos, roles) con los mismos ids que producción.
- Usuarios de demo: admin / operadores por área (contraseña en DEMO_PASSWORD).
- Unidades ADO-101 y ADO-102 registradas HOY, ruta Desfogue → Diesel →
  Ad-Blue → Salida, ambas paradas en Desfogue (estado inicial).

Solo corre contra una base local (localhost/127.0.0.1): borra los movimientos
de las 2 unidades de demo. Para otra base, --permitir-remoto (no lo hagas
contra la Supabase compartida).
"""
import os
import sys
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from config import DATABASE_URL  # noqa: E402
from tiempo import ahora, hoy  # noqa: E402

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
]


def main() -> None:
    host = urlparse(DATABASE_URL).hostname or ""
    if host not in ("localhost", "127.0.0.1") and "--permitir-remoto" not in sys.argv:
        sys.exit(f"Abortado: DATABASE_URL apunta a '{host}', no a una base local.")

    engine = create_engine(DATABASE_URL)
    f, now = hoy(), ahora()
    with engine.begin() as c:
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

        for serie in UNIDADES:
            c.execute(text("DELETE FROM movements WHERE serial_number=:s"), {"s": serie})
            c.execute(text("DELETE FROM area_checklists WHERE record_id IN"
                           " (SELECT id FROM records WHERE serial_number=:s)"), {"s": serie})
            c.execute(text("DELETE FROM records WHERE serial_number=:s AND date<>:f"), {"s": serie, "f": f})
            c.execute(text("DELETE FROM trips WHERE serial_number=:s AND date<>:f"), {"s": serie, "f": f})
            c.execute(text("""
                INSERT INTO trips (date, serial_number, type_id, scheduled_time, departure_time,
                    needs_drainage, needs_diesel, needs_adblue, driver_name,
                    origin_terminal, destination_terminal, notes, last_modified_by)
                VALUES (:f, :s, 5, '08:00', '09:00', 1, 1, 1, :cond, 'Oaxaca', 'CDMX', 'DEMO NFC', 'app')
                ON CONFLICT (date, serial_number) DO UPDATE SET type_id=5,
                    needs_reception=0, needs_drainage=1, needs_diesel=1, needs_adblue=1,
                    needs_workshop=0, needs_int_wash=0, needs_ext_wash=0, notes='DEMO NFC'
            """), {"f": f, "s": serie, "cond": f"Conductor {serie}"})
            rid = c.execute(text("""
                INSERT INTO records (date, serial_number, type_id, is_active, registration_time, last_modified_by)
                VALUES (:f, :s, 5, true, :ts, 'app')
                ON CONFLICT (date, serial_number) DO UPDATE SET is_active=true, location_text=NULL
                RETURNING id
            """), {"f": f, "s": serie, "ts": now}).scalar()
            c.execute(text("""
                INSERT INTO movements (record_id, area_id, serial_number, date, entry_time, last_modified_by)
                VALUES (:rid, 4, :s, :d, :t, 'app')
            """), {"rid": rid, "s": serie, "d": f, "t": now.time()})

    print(f"Demo lista ({f}): ADO-101 y ADO-102 en Desfogue. "
          f"Usuarios {', '.join(u[0] for u in USUARIOS)} / contraseña {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
