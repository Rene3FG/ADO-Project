"""Check-in por NFC/QR desde un celular, sin login (demo de la maqueta).

GET /checkin?unidad=ADO-101&k=<CHECKIN_TOKEN>

El tag NFC (registro URL) o el QR del autobús abren esta URL en el navegador
del celular. Cada lectura avanza la unidad al siguiente paso de SU ruta —la
misma lógica de avanzar_camion (swipe/NFC del operador) y routing.py—. Al
pasar por Salida el ciclo vuelve a empezar en la primera área de la ruta.

Protección: token compartido CHECKIN_TOKEN (variable de entorno). Si no está
definido el endpoint queda deshabilitado. Lecturas repetidas de la misma
unidad en menos de DEBOUNCE_SEGUNDOS se ignoran (el NFC a veces lee doble).
"""
from __future__ import annotations

import html
import os
import re
import secrets
import threading
import time
import traceback
from typing import Callable, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy import text

from routing import NEED_FIELD_TO_AREA, calcular_ruta
from tiempo import ahora, hoy

DEBOUNCE_SEGUNDOS = 5.0

# Unidades de la maqueta: si no están registradas hoy, la primera lectura las
# da de alta. Cualquier otra unidad no registrada hoy responde 404.
def unidades_demo() -> set[int]:
    return {int(x) for x in os.environ.get("CHECKIN_UNIDADES", "101,102").split(",") if x.strip().isdigit()}


# Ruta de cada unidad de la maqueta = áreas que necesita su viaje (needs_* de
# trips). El ORDEN lo pone routing.WORKFLOW_ORDER y al final siempre va Salida.
# Único lugar donde se define; lo usan /checkin, la app y scripts/reset_demo.py.
RUTA_CORTA = ("Desfogue", "Diesel", "Ad-Blue")
RUTAS_DEMO: dict[int, tuple[str, ...]] = {
    101: ("Desfogue", "Diesel", "Ad-Blue", "Taller", "Lavado Interior", "Lavado Exterior"),
    102: RUTA_CORTA,
}


def needs_demo(serie: int) -> dict[str, int]:
    """Banderas needs_* del viaje de una unidad de la maqueta según RUTAS_DEMO."""
    ruta = RUTAS_DEMO.get(serie, RUTA_CORTA)
    return {campo: int(area in ruta) for campo, area in NEED_FIELD_TO_AREA.items()}


_SET_NEEDS = ", ".join(f"{c}=:{c}" for c in NEED_FIELD_TO_AREA)


def registrar_unidad_demo(conn, serie: int, area_inicial_id: int) -> None:
    """Alta de HOY de una unidad de la maqueta (trip + record + movimiento en
    el área inicial). Idempotente. La usan /checkin y scripts/reset_demo.py."""
    f, now = hoy(), ahora()
    conn.execute(text("""
        INSERT INTO trips (date, serial_number, type_id, scheduled_time, departure_time,
            needs_drainage, needs_diesel, needs_adblue,
            needs_workshop, needs_int_wash, needs_ext_wash, driver_name,
            origin_terminal, destination_terminal, notes,
            is_dirty, last_modified_by, last_modified_at)
        VALUES (:f, :s, (SELECT id FROM bus_types WHERE name='ADO'), '08:00', '09:00',
            :needs_drainage, :needs_diesel, :needs_adblue,
            :needs_workshop, :needs_int_wash, :needs_ext_wash,
            :cond, 'Oaxaca', 'CDMX', 'DEMO NFC', false, 'app', :ts)
        ON CONFLICT (date, serial_number) DO UPDATE SET
            needs_reception=0, """ + _SET_NEEDS + """, notes='DEMO NFC'
    """), {"f": f, "s": serie, "cond": f"Conductor {serie}", "ts": now, **needs_demo(serie)})
    rid = conn.execute(text("""
        INSERT INTO records (date, serial_number, type_id, is_active, registration_time,
            is_dirty, last_modified_by, last_modified_at)
        VALUES (:f, :s, (SELECT id FROM bus_types WHERE name='ADO'), true, :ts, false, 'app', :ts)
        ON CONFLICT (date, serial_number) DO UPDATE SET is_active=true, location_text=NULL
        RETURNING id
    """), {"f": f, "s": serie, "ts": now}).scalar()
    conn.execute(text("""
        INSERT INTO movements (record_id, area_id, serial_number, date, entry_time, last_modified_by)
        VALUES (:rid, :aid, :s, :d, :t, 'app')
    """), {"rid": rid, "aid": area_inicial_id, "s": serie, "d": f, "t": now.time()})

_ultima_lectura: dict[int, float] = {}
_lock = threading.Lock()


def _reloj() -> float:
    return time.monotonic()


def etiqueta(serie: int) -> str:
    return f"ADO-{serie}"


def _parse_unidad(unidad: str) -> Optional[int]:
    m = re.fullmatch(r"\s*(?:ADO[-_ ]?)?(\d{1,9})\s*", unidad or "", re.IGNORECASE)
    return int(m.group(1)) if m else None


def _pagina(ok: bool, titulo: str, detalle: str = "", status: int = 200,
            aviso: bool = False) -> HTMLResponse:
    color = "#b45309" if aviso else ("#15803d" if ok else "#b91c1c")
    fondo = "#fffbeb" if aviso else ("#f0fdf4" if ok else "#fef2f2")
    cuerpo = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SCA · Check-in</title>
<style>
  body {{ margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         font-family:system-ui,-apple-system,sans-serif; background:{fondo}; color:#111; }}
  main {{ text-align:center; padding:24px; }}
  h1 {{ font-size:2rem; line-height:1.3; margin:0 0 12px; color:{color}; }}
  p {{ font-size:1.15rem; margin:0; color:#333; }}
  small {{ display:block; margin-top:24px; color:#666; }}
</style></head>
<body><main>
  <h1>{html.escape(titulo)}</h1>
  <p>{html.escape(detalle)}</p>
  <small>SCA · ADO Oaxaca</small>
</main></body></html>"""
    return HTMLResponse(cuerpo, status_code=status)


def entrada_demo(db: Callable, serie: int, area_operador: Optional[str],
                 area_display_to_db: dict) -> Optional[dict]:
    """Entrada al patio de una unidad de la maqueta que no está en él: alta del
    día (si no existe hoy) o reingreso tras Salida (ciclo). La recibe la
    primera estación de su ruta: un operador de otra área recibe 403.
    Devuelve None si no aplica (unidad no-demo, o ya activa en el patio) para
    que el avance normal siga su curso."""
    if serie not in unidades_demo():
        return None
    target = str(hoy())
    with db() as conn:
        conn.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": 7_000_000 + serie})
        record = conn.execute(text(
            "SELECT id, is_active FROM records WHERE serial_number=:s AND date=:f"
        ), {"s": serie, "f": target}).fetchone()
        if record and record.is_active:
            return None
        # Cada ciclo toma la ruta vigente de RUTAS_DEMO (sin esperar a un reset).
        conn.execute(text(
            "UPDATE trips SET " + _SET_NEEDS +
            " WHERE serial_number=:s AND date=:f AND notes='DEMO NFC'"
        ), {"s": serie, "f": target, **needs_demo(serie)})
        trip = conn.execute(text(
            "SELECT needs_drainage, needs_diesel, needs_adblue,"
            " needs_workshop, needs_int_wash, needs_ext_wash"
            " FROM trips WHERE serial_number=:s AND date=:f"
        ), {"s": serie, "f": target}).fetchone()
        destino = calcular_ruta(trip)[0] if (record and trip) else "Desfogue"
        if destino == "Salida":
            raise HTTPException(409, f"La unidad {etiqueta(serie)} no tiene áreas en su ruta.")
        if area_operador and area_operador != destino:
            raise HTTPException(403, f"Este camión no está en tu área ({area_operador}). "
                                     f"Su entrada la registra {destino}.")
        area_id = conn.execute(text("SELECT id FROM area WHERE name=:n"),
                               {"n": area_display_to_db.get(destino, destino)}).scalar()
        if area_id is None:
            raise HTTPException(404, f"Área '{destino}' no encontrada en la DB")

        if not record:
            registrar_unidad_demo(conn, serie, area_id)
        else:
            now = ahora()
            conn.execute(text(
                "UPDATE records SET is_active=true, is_dirty=true,"
                " last_modified_by='app', last_modified_at=:ts WHERE id=:id"
            ), {"id": record.id, "ts": now})
            conn.execute(text(
                "INSERT INTO movements (record_id, area_id, serial_number, date, entry_time,"
                " is_dirty, last_modified_by, last_modified_at)"
                " VALUES (:rid, :aid, :s, :d, :t, true, 'app', :ts)"
            ), {"rid": record.id, "aid": area_id, "s": serie,
                "d": now.date(), "t": now.time(), "ts": now})
    return {"ok": True, "serie": serie, "area_anterior": "Salida" if record else None,
            "area_nueva": destino}


def _respuesta(como_json: bool, ok: bool, titulo: str, detalle: str = "", status: int = 200,
               aviso: bool = False, **extra):
    """HTML para el celular que abre la URL; JSON para la app (fetch)."""
    if como_json:
        cuerpo = {"ok": ok, "aviso": aviso, "mensaje": titulo, "detalle": detalle, **extra}
        if not ok:
            cuerpo["detail"] = detalle or titulo  # lo que muestra apiFetch del frontend
        return JSONResponse(cuerpo, status_code=status)
    return _pagina(ok, titulo, detalle, status, aviso)


def crear_router(db: Callable, avanzar: Callable[[int, Optional[str]], dict],
                 area_sesion: Callable) -> APIRouter:
    """avanzar = api.avanzar_camion (incluye entrada_demo). area_sesion =
    dependencia que devuelve el área del Operador si la petición trae su JWT
    (None sin sesión o para Admin/Supervisor): desde la app se respeta el área."""
    router = APIRouter()

    def _registrada_hoy(serie: int) -> bool:
        with db() as conn:
            return conn.execute(text(
                "SELECT 1 FROM records WHERE serial_number=:s AND date=:f"
            ), {"s": serie, "f": str(hoy())}).fetchone() is not None

    @router.get("/checkin", response_class=HTMLResponse,
                summary="Check-in por NFC/QR (sin login, token en la URL)")
    def checkin(request: Request, unidad: str = Query(default=""), k: str = Query(default=""),
                area_operador: Optional[str] = Depends(area_sesion)):
        como_json = "application/json" in request.headers.get("accept", "")
        responder = lambda *a, **kw: _respuesta(como_json, *a, **kw)  # noqa: E731
        token = os.environ.get("CHECKIN_TOKEN", "")
        if not token:
            return responder(False, "❌ Check-in deshabilitado",
                             "Falta CHECKIN_TOKEN en el servidor.", 503)
        if not k or not secrets.compare_digest(k.encode(), token.encode()):
            return responder(False, "❌ Acceso no autorizado",
                             "El enlace no tiene un token válido.", 403)

        serie = _parse_unidad(unidad)
        if serie is None:
            return responder(False, "❌ Unidad no válida",
                             f"'{unidad}' no es un identificador de unidad.", 400)

        with _lock:
            t = _reloj()
            previa = _ultima_lectura.get(serie)
            if previa is not None and t - previa < DEBOUNCE_SEGUNDOS:
                return responder(True, f"⏳ {etiqueta(serie)}: lectura repetida",
                                 "Ya se registró hace un momento; se ignoró.", 200, aviso=True,
                                 unidad=etiqueta(serie))
            _ultima_lectura[serie] = t

        try:
            if serie not in unidades_demo() and not _registrada_hoy(serie):
                raise HTTPException(404, f"La unidad {etiqueta(serie)} no está registrada hoy.")
            nueva = avanzar(serie, area_operador)["area_nueva"]
        except HTTPException as e:
            with _lock:
                _ultima_lectura.pop(serie, None)
            return responder(False, "❌ No se pudo registrar", str(e.detail), e.status_code,
                             unidad=etiqueta(serie))
        except Exception:
            traceback.print_exc()
            with _lock:
                _ultima_lectura.pop(serie, None)
            return responder(False, "❌ Error interno",
                             "No se pudo registrar el paso. Intenta de nuevo.", 500)

        hora = f"{ahora():%H:%M}"
        return responder(True, f"✅ {etiqueta(serie)} → {nueva}", f"({hora})",
                         unidad=etiqueta(serie), area_nueva=nueva, hora=hora)

    return router
