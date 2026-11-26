"""Crea (o re-genera la contraseña de) un operador por cada área del patio.

    python scripts/crear_operadores.py

Usuario = número de empleado (lo que pide el login). Imprime usuario y
contraseña UNA vez; en la base solo queda el hash bcrypt.
"""
import os
import secrets
import string
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from config import DATABASE_URL  # noqa: E402

# usuario, área (nombre en DB), apellido mostrado
OPERADORES = [
    ("3001", "DRAINAGE", "Desfogue"),
    ("3002", "DIESEL", "Diesel"),
    ("3003", "ADDBLUE", "Ad-Blue"),
    ("3004", "WORKSHOP", "Taller"),
    ("3005", "INTERIOR WASH", "Lavado Interior"),
    ("3006", "EXTERIOR WASH", "Lavado Exterior"),
]


def _contrasena() -> str:
    # sin caracteres ambiguos (0/O, 1/l/I) para dictarla en voz alta
    alfabeto = "".join(c for c in string.ascii_letters + string.digits if c not in "0O1lI")
    return "".join(secrets.choice(alfabeto) for _ in range(8))


def main() -> None:
    engine = create_engine(DATABASE_URL)
    filas = []
    with engine.begin() as c:
        rol = c.execute(text("SELECT id FROM roles WHERE name='Operator'")).scalar()
        for usuario, area_db, apellido in OPERADORES:
            area_id = c.execute(text("SELECT id FROM area WHERE name=:n"), {"n": area_db}).scalar()
            if area_id is None:
                sys.exit(f"Abortado: no existe el área {area_db}")
            otro = c.execute(text("SELECT role_id FROM users WHERE username=:u"), {"u": usuario}).fetchone()
            if otro and otro.role_id != rol:
                sys.exit(f"Abortado: el usuario {usuario} ya existe con otro rol")
            pw = _contrasena()
            c.execute(text("""
                INSERT INTO users (username, role_id, password_hash, first_name, last_name, assigned_area_id)
                VALUES (:u, :r, :p, 'Operador', :a, :area)
                ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash,
                    assigned_area_id=EXCLUDED.assigned_area_id, last_name=EXCLUDED.last_name,
                    is_active=true
            """), {"u": usuario, "r": rol, "p": bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode(),
                   "a": apellido, "area": area_id})
            filas.append((apellido, usuario, pw))
    for apellido, usuario, pw in filas:
        print(f"{apellido:16} usuario {usuario}  contraseña {pw}")


if __name__ == "__main__":
    main()
