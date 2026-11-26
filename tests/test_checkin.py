"""Pruebas de GET /checkin contra la base LOCAL de la demo (nunca Supabase).

    set -a; . demo/demo.env; set +a; python3 -m pytest tests/test_checkin.py -v
"""
import os
from urllib.parse import urlparse

import pytest

if urlparse(os.environ.get("DATABASE_URL", "")).hostname not in ("localhost", "127.0.0.1"):
    pytest.skip("requiere la base local de la demo (demo/demo.env)", allow_module_level=True)

os.environ["DISABLE_SYNC"] = "1"
os.environ.setdefault("CHECKIN_TOKEN", "token-de-prueba")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

import api  # noqa: E402
import checkin  # noqa: E402
from scripts import reset_demo  # noqa: E402
from tiempo import hoy  # noqa: E402

TOKEN = os.environ["CHECKIN_TOKEN"]
client = TestClient(api.app)


class Reloj:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


@pytest.fixture(autouse=True)
def demo_limpia(monkeypatch):
    reset_demo.main()
    checkin._ultima_lectura.clear()
    reloj = Reloj()
    monkeypatch.setattr(checkin, "_reloj", reloj)
    yield reloj
    reset_demo.main()


def leer(unidad, k=TOKEN):
    params = {"unidad": unidad}
    if k is not None:
        params["k"] = k
    return client.get("/checkin", params=params)


def area_actual(serie):
    with api.db() as c:
        r = c.execute(text(
            "SELECT a.name, m.is_completed, rec.is_active FROM movements m"
            " JOIN area a ON a.id=m.area_id JOIN records rec ON rec.id=m.record_id"
            " WHERE m.serial_number=:s ORDER BY m.id DESC LIMIT 1"), {"s": serie}).fetchone()
    return None if r is None else (r.name, r.is_completed, r.is_active)


def login(username):
    r = client.post("/login", json={"username": username, "password": reset_demo.DEMO_PASSWORD})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_unidad_valida_avanza_y_responde_html():
    r = leer("ADO-101")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]
    assert "✅ ADO-101 → Diesel" in r.text
    assert area_actual(101) == ("DIESEL", False, True)
    assert area_actual(102) == ("DRAINAGE", False, True)  # la otra no se mueve


def test_acepta_solo_el_numero():
    assert "✅ ADO-102 → Diesel" in leer("102").text


def test_unidad_inexistente():
    r = leer("ADO-999")
    assert r.status_code == 404
    assert "no está registrada hoy" in r.text and "#b91c1c" in r.text


def test_unidad_mal_formada():
    assert leer("camion<script>").status_code == 400


@pytest.mark.parametrize("k", [None, "", "incorrecto"])
def test_token_incorrecto_o_ausente(k):
    r = leer("ADO-101", k=k)
    assert r.status_code == 403
    assert area_actual(101) == ("DRAINAGE", False, True)


def test_sin_token_configurado_queda_deshabilitado(monkeypatch):
    monkeypatch.delenv("CHECKIN_TOKEN")
    assert leer("ADO-101", k="lo-que-sea").status_code == 503


def test_doble_lectura_menor_a_5s(demo_limpia):
    assert "→ Diesel" in leer("ADO-101").text
    demo_limpia.t += 2
    r = leer("ADO-101")
    assert r.status_code == 200 and "lectura repetida" in r.text
    assert area_actual(101) == ("DIESEL", False, True)
    # la otra unidad no queda bloqueada por la primera
    assert "→ Diesel" in leer("ADO-102").text
    demo_limpia.t += 4  # 6 s después de la primera lectura
    assert "→ Ad-Blue" in leer("ADO-101").text


def test_error_no_bloquea_la_siguiente_lectura(demo_limpia):
    assert leer("ADO-999").status_code == 404
    assert leer("ADO-999").status_code == 404  # no responde "repetida"


def test_ciclo_completo_vuelve_al_inicio(demo_limpia):
    esperado = [("Diesel", ("DIESEL", False, True)),
                ("Ad-Blue", ("ADDBLUE", False, True)),
                ("Salida", ("ADDBLUE", True, False)),
                ("Desfogue", ("DRAINAGE", False, True)),
                ("Diesel", ("DIESEL", False, True))]
    for nombre, estado in esperado:
        demo_limpia.t += 6
        r = leer("ADO-101")
        assert f"✅ ADO-101 → {nombre}" in r.text, r.text
        assert area_actual(101) == estado
    hist = client.get("/historial", params={"unidad": "101"}).json()
    assert [h["mensaje"].split(" entró a ")[1] for h in hist][:5] == \
        ["Diesel", "Desfogue", "Ad-Blue", "Diesel", "Desfogue"]


def test_roles_operador_ve_solo_su_area_y_admin_todas(demo_limpia):
    leer("ADO-101")  # 101 → Diesel, 102 sigue en Desfogue
    admin = client.get("/camiones", headers=login("admin")).json()
    assert {(c["codigo"], c["area"]) for c in admin} == {("101", "Diesel"), ("102", "Desfogue")}
    diesel = client.get("/camiones", headers=login("op_diesel")).json()
    assert [(c["codigo"], c["area"]) for c in diesel] == [("101", "Diesel")]
    desfogue = client.get("/camiones", headers=login("op_desfogue")).json()
    assert [(c["codigo"], c["area"]) for c in desfogue] == [("102", "Desfogue")]
    adblue = client.get("/camiones", headers=login("op_adblue")).json()
    assert adblue == []
    movs = client.get("/movimientos", headers=login("op_diesel")).json()
    assert {m["serie"] for m in movs if not m["completado"]} == {101}


def test_fecha_es_hoy():
    leer("ADO-101")
    with api.db() as c:
        assert c.execute(text("SELECT date FROM movements WHERE serial_number=101"
                              " ORDER BY id DESC LIMIT 1")).scalar() == hoy()


def test_unidad_de_la_maqueta_se_da_de_alta_sola():
    """Si la demo pasa de medianoche (o no se corrió reset), la primera lectura
    de ADO-101/102 la registra hoy en Desfogue; otras series siguen en 404."""
    with api.db() as c:
        c.execute(text("DELETE FROM movements WHERE serial_number=101"))
        c.execute(text("DELETE FROM records WHERE serial_number=101"))
        c.execute(text("DELETE FROM trips WHERE serial_number=101"))
    r = leer("ADO-101")
    assert "✅ ADO-101 → Desfogue" in r.text, r.text
    assert area_actual(101) == ("DRAINAGE", False, True)
    assert leer("ADO-103").status_code == 404


def test_alta_concurrente_no_duplica():
    import concurrent.futures as cf
    with api.db() as c:
        c.execute(text("DELETE FROM movements WHERE serial_number=101"))
        c.execute(text("DELETE FROM records WHERE serial_number=101"))
    checkin._ultima_lectura.clear()
    # dos lecturas simultáneas saltándose el antirrebote: una sola alta
    with cf.ThreadPoolExecutor(2) as ex:
        list(ex.map(lambda _: client.get("/checkin", params={"unidad": "ADO-101", "k": TOKEN}),
                    range(2)))
    with api.db() as c:
        n = c.execute(text("SELECT count(*) FROM movements WHERE serial_number=101")).scalar()
    assert n == 1


def test_flujo_app_operador_por_estacion():
    """Flujo real: cada operador escanea en la app (POST /camiones/{serie}/avanzar)
    y la unidad pasa a la siguiente estación, donde la recibe otro operador."""
    op = {u: login(u) for u in ("op_desfogue", "op_diesel", "op_adblue")}
    avanzar = lambda u, s=101: client.post(f"/camiones/{s}/avanzar", headers=op[u])  # noqa: E731
    assert avanzar("op_diesel").status_code == 403          # aún está en Desfogue
    assert avanzar("op_desfogue").json()["area_nueva"] == "Diesel"
    assert avanzar("op_desfogue").status_code == 403        # ya no es de su área
    assert avanzar("op_diesel").json()["area_nueva"] == "Ad-Blue"
    assert avanzar("op_adblue").json()["area_nueva"] == "Salida"
    assert area_actual(101) == ("ADDBLUE", True, False)
    assert avanzar("op_diesel").status_code == 403          # la entrada es de Desfogue
    r = avanzar("op_desfogue").json()                        # nuevo ciclo
    assert (r["area_anterior"], r["area_nueva"]) == ("Salida", "Desfogue")
    assert area_actual(101) == ("DRAINAGE", False, True)


def test_flujo_app_alta_del_dia_la_hace_desfogue():
    with api.db() as c:
        c.execute(text("DELETE FROM movements WHERE serial_number=102"))
        c.execute(text("DELETE FROM records WHERE serial_number=102"))
        c.execute(text("DELETE FROM trips WHERE serial_number=102"))
    assert client.post("/camiones/102/avanzar", headers=login("op_diesel")).status_code == 403
    r = client.post("/camiones/102/avanzar", headers=login("op_desfogue"))
    assert r.json()["area_nueva"] == "Desfogue"
    assert client.post("/camiones/999/avanzar", headers=login("op_desfogue")).status_code == 404
