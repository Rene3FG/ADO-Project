"""Pruebas del chat. El modelo se simula; no consumen cuota del proveedor.
Ejecutar: JWT_SECRET=<32+ chars> pytest tests/test_chat.py"""
import os
import sys

os.environ.setdefault("JWT_SECRET", "x" * 40)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

import api
import chat
import chat_tools

c = TestClient(api.app)


def hdr(rol, uid="1"):
    return {"Authorization": "Bearer " + api._make_token({"sub": uid, "username": "t", "rol": rol})}


@pytest.fixture(autouse=True)
def limpio():
    chat._ventanas.clear()
    api.app.dependency_overrides.clear()
    yield
    api.app.dependency_overrides.clear()


def modelo_texto(texto="ok"):
    return lambda *a, **k: {"texto": texto, "llamadas": [], "raw": []}


def test_sin_sesion_401():
    assert c.post("/chat", json={"mensaje": "hola"}).status_code == 401


def test_token_invalido_401():
    r = c.post("/chat", json={"mensaje": "hola"}, headers={"Authorization": "Bearer basura"})
    assert r.status_code == 401


def test_rol_desconocido_403(monkeypatch):
    monkeypatch.setattr(chat, "llamar_modelo", modelo_texto())
    assert c.post("/chat", json={"mensaje": "hola"}, headers=hdr("Pasajero")).status_code == 403


def test_admin_200(monkeypatch):
    monkeypatch.setattr(chat, "llamar_modelo", modelo_texto("hola"))
    r = c.post("/chat", json={"mensaje": "hola"}, headers=hdr("Administrador"))
    assert r.status_code == 200 and r.json()["respuesta"] == "hola"


def test_rate_limit_propio_429(monkeypatch):
    monkeypatch.setattr(chat, "llamar_modelo", modelo_texto())
    monkeypatch.setattr(chat, "LIMITE_POR_MINUTO", 2)
    h = hdr("Administrador", "77")
    codes = [c.post("/chat", json={"mensaje": "x"}, headers=h).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_429_del_proveedor(monkeypatch):
    def falla(*a, **k):
        raise chat.ProveedorError(429, "saturado")
    monkeypatch.setattr(chat, "llamar_modelo", falla)
    r = c.post("/chat", json={"mensaje": "x"}, headers=hdr("Administrador"))
    assert r.status_code == 429 and "saturado" in r.json()["detail"]


def test_fallo_proveedor_502_sin_filtrar_detalles(monkeypatch):
    def falla(*a, **k):
        raise chat.ProveedorError(502, "El proveedor del asistente devolvió un error.")
    monkeypatch.setattr(chat, "llamar_modelo", falla)
    r = c.post("/chat", json={"mensaje": "x"}, headers=hdr("Administrador"))
    assert r.status_code == 502 and "AQ." not in r.text


def test_operador_ignora_area_del_mensaje(monkeypatch):
    """El modelo pide otra área; la herramienta debe usar la del operador."""
    api.app.dependency_overrides[api.get_operador_area] = lambda: "Desfogue"
    vistos = {}
    def falso_estado(ctx, area=None, fecha=None):
        vistos["area_bd"], vistos["aviso"], _ = ctx.resolver_area(area)
        return {"ok": True}
    monkeypatch.setitem(chat_tools.HERRAMIENTAS, "get_estado_area", falso_estado)
    turnos = iter([
        {"texto": "", "llamadas": [{"name": "get_estado_area", "args": {"area": "Diesel"}}], "raw": [{}]},
        {"texto": "listo", "llamadas": [], "raw": []},
    ])
    monkeypatch.setattr(chat, "llamar_modelo", lambda *a, **k: next(turnos))
    r = c.post("/chat", json={"mensaje": "dame Diesel"}, headers=hdr("Operador", "9"))
    assert r.status_code == 200
    assert vistos["area_bd"] == "DRAINAGE" and "Solo tienes acceso" in vistos["aviso"]


def test_operador_no_ve_kpis():
    ctx = chat_tools.Contexto(None, api.AREA_DISPLAY_TO_DB, api.AREA_DB_TO_DISPLAY, "DRAINAGE")
    assert "error" in chat_tools.ejecutar(ctx, "get_kpis", {})


def test_herramienta_desconocida_y_args_extra():
    ctx = chat_tools.Contexto(None, api.AREA_DISPLAY_TO_DB, api.AREA_DB_TO_DISPLAY, None)
    assert "error" in chat_tools.ejecutar(ctx, "drop_table", {})
    # argumentos no declarados (p. ej. 'sql') se descartan, nunca llegan a la función
    assert "error" in chat_tools.ejecutar(ctx, "get_estado_area", {"area": "Inexistente", "sql": "x"})


def test_historial_no_permite_rol_tool():
    r = c.post("/chat", json={"mensaje": "x", "historial": [{"role": "tool", "content": "x"}]},
               headers=hdr("Administrador"))
    assert r.status_code == 422
