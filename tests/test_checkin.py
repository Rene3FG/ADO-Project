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
    """ADO-102: ruta corta."""
    esperado = [("Diesel", ("DIESEL", False, True)),
                ("Ad-Blue", ("ADDBLUE", False, True)),
                ("Salida", ("ADDBLUE", True, False)),
                ("Desfogue", ("DRAINAGE", False, True)),
                ("Diesel", ("DIESEL", False, True))]
    for nombre, estado in esperado:
        demo_limpia.t += 6
        r = leer("ADO-102")
        assert f"✅ ADO-102 → {nombre}" in r.text, r.text
        assert area_actual(102) == estado
    hist = client.get("/historial", params={"unidad": "102"}).json()
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
    avanzar = lambda u, s=102: client.post(f"/camiones/{s}/avanzar", headers=op[u])  # noqa: E731
    assert avanzar("op_diesel").status_code == 403          # aún está en Desfogue
    assert avanzar("op_desfogue").json()["area_nueva"] == "Diesel"
    assert avanzar("op_desfogue").status_code == 403        # ya no es de su área
    assert avanzar("op_diesel").json()["area_nueva"] == "Ad-Blue"
    assert avanzar("op_adblue").json()["area_nueva"] == "Salida"
    assert area_actual(102) == ("ADDBLUE", True, False)
    assert avanzar("op_diesel").status_code == 403          # la entrada es de Desfogue
    r = avanzar("op_desfogue").json()                        # nuevo ciclo
    assert (r["area_anterior"], r["area_nueva"]) == ("Salida", "Desfogue")
    assert area_actual(102) == ("DRAINAGE", False, True)


def test_flujo_app_alta_del_dia_la_hace_desfogue():
    with api.db() as c:
        c.execute(text("DELETE FROM movements WHERE serial_number=102"))
        c.execute(text("DELETE FROM records WHERE serial_number=102"))
        c.execute(text("DELETE FROM trips WHERE serial_number=102"))
    assert client.post("/camiones/102/avanzar", headers=login("op_diesel")).status_code == 403
    r = client.post("/camiones/102/avanzar", headers=login("op_desfogue"))
    assert r.json()["area_nueva"] == "Desfogue"
    assert client.post("/camiones/999/avanzar", headers=login("op_desfogue")).status_code == 404


def cola_operador(username):
    """Lo mismo que calcula la vista móvil del operador (PatioPage):
    /registros activos + movimiento abierto de su área en /movimientos."""
    h = login(username)
    activos = {r["serie"] for r in client.get("/registros", headers=h).json()}
    movs = client.get("/movimientos", headers=h).json()
    return sorted(m["serie"] for m in movs if not m["completado"] and m["serie"] in activos)


def test_cola_del_operador_sigue_al_checkin(demo_limpia):
    pasos = [("op_diesel", "Diesel"), ("op_adblue", "Ad-Blue"), (None, "Salida"), ("op_desfogue", "Desfogue")]
    anterior = "op_desfogue"
    assert cola_operador("op_desfogue") == [101, 102]
    for dueno, area in pasos:
        demo_limpia.t += 6
        assert f"→ {area}" in leer("ADO-102").text
        assert 102 not in cola_operador(anterior)
        if dueno:
            assert 102 in cola_operador(dueno)
            anterior = dueno


def test_checkin_json_desde_la_app(demo_limpia):
    r = client.get("/checkin", params={"unidad": "ADO-101", "k": TOKEN},
                   headers={"Accept": "application/json"})
    assert r.status_code == 200
    j = r.json()
    assert j["ok"] and j["unidad"] == "ADO-101" and j["area_nueva"] == "Diesel" and j["hora"]
    demo_limpia.t += 1
    j = client.get("/checkin", params={"unidad": "ADO-101", "k": TOKEN},
                   headers={"Accept": "application/json"}).json()
    assert j["ok"] and j["aviso"]
    r = client.get("/checkin", params={"unidad": "ADO-101", "k": "mal"}, headers={"Accept": "application/json"})
    assert r.status_code == 403 and r.json()["ok"] is False


def test_checkin_con_sesion_respeta_el_area(demo_limpia):
    h = {"Accept": "application/json"}
    q = {"unidad": "ADO-101", "k": TOKEN}
    r = client.get("/checkin", params=q, headers={**h, **login("op_diesel")})
    assert r.status_code == 403 and "no está en tu área" in r.json()["detalle"]
    assert area_actual(101) == ("DRAINAGE", False, True)
    r = client.get("/checkin", params=q, headers={**h, **login("op_desfogue")})
    assert r.json()["area_nueva"] == "Diesel"
    demo_limpia.t += 6
    r = client.get("/checkin", params=q, headers={**h, **login("admin")})  # admin: todas
    assert r.json()["area_nueva"] == "Ad-Blue"
    r = client.get("/checkin", params=q, headers={**h, "Authorization": "Bearer basura"})
    assert r.status_code == 401


RUTA_LARGA = [("op_desfogue", "Diesel", "DIESEL"), ("op_diesel", "Ad-Blue", "ADDBLUE"),
              ("op_adblue", "Taller", "WORKSHOP"), ("op_taller", "Lavado Interior", "INTERIOR WASH"),
              ("op_lav_int", "Lavado Exterior", "EXTERIOR WASH"), ("op_lav_ext", "Salida", None)]


def test_ado101_recorre_las_seis_estaciones(demo_limpia):
    """ADO-101: cada operador manda la unidad a la siguiente estación de SU ruta;
    sale de la cola anterior y entra a la siguiente; el admin la ve siempre."""
    ops = [p[0] for p in RUTA_LARGA]
    for i, (op, destino, area_db) in enumerate(RUTA_LARGA):
        for otro in ops:  # escaneo en estación equivocada → 403
            if otro != op:
                r = client.post("/camiones/101/avanzar", headers=login(otro))
                assert r.status_code == 403 and "no está en tu área" in r.json()["detail"]
        assert 101 in cola_operador(op)
        r = client.post("/camiones/101/avanzar", headers=login(op)).json()
        assert r["area_nueva"] == destino
        assert 101 not in cola_operador(op)
        admin = {c["codigo"]: c["area"] for c in client.get("/camiones", headers=login("admin")).json()}
        if area_db:
            assert area_actual(101) == (area_db, False, True)
            assert 101 in cola_operador(RUTA_LARGA[i + 1][0])
            assert admin.get("101") == destino
        else:
            assert area_actual(101) == ("EXTERIOR WASH", True, False)
            assert "101" not in admin
    # nuevo ciclo desde Salida: solo Desfogue lo recibe
    assert client.post("/camiones/101/avanzar", headers=login("op_diesel")).status_code == 403
    r = client.post("/camiones/101/avanzar", headers=login("op_desfogue")).json()
    assert (r["area_anterior"], r["area_nueva"]) == ("Salida", "Desfogue")
    assert area_actual(102) == ("DRAINAGE", False, True)  # la otra no se movió


def test_ado101_por_checkin_sin_sesion(demo_limpia):
    for _, destino, _ in RUTA_LARGA + [("op_desfogue", "Desfogue", None)]:
        demo_limpia.t += 6
        assert f"✅ ADO-101 → {destino}" in leer("ADO-101").text


def test_rutas_definidas_en_un_solo_lugar():
    with api.db() as c:
        for serie in (101, 102):
            trip = c.execute(text("SELECT * FROM trips WHERE serial_number=:s AND date=:f"),
                             {"s": serie, "f": hoy()}).fetchone()
            assert tuple(checkin.calcular_ruta(trip)[:-1]) == checkin.RUTAS_DEMO[serie]


def test_cors_preflight_desde_vercel():
    r = client.options("/checkin", headers={
        "Origin": "https://adopt-2.vercel.app",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization,accept",
    })
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] in ("*", "https://adopt-2.vercel.app")
