from __future__ import annotations

# Ruta automática de un camión a través del patio, a partir de los flags
# needs_* capturados en PLANEACION (tabla trips). Mismo orden canónico que
# WORKFLOW_ORDER en el frontend (src/lib/logic/useRegistroBloc.js) — Recepción
# queda fuera del loop secuencial, es un paso previo a la entrada al patio.

WORKFLOW_ORDER = ["Desfogue", "Diesel", "Ad-Blue", "Taller", "Lavado Interior", "Lavado Exterior"]

NEED_FIELD_TO_AREA = {
    "needs_drainage": "Desfogue",
    "needs_diesel":   "Diesel",
    "needs_adblue":   "Ad-Blue",
    "needs_workshop": "Taller",
    "needs_int_wash": "Lavado Interior",
    "needs_ext_wash": "Lavado Exterior",
}


def calcular_ruta(trip_row) -> list[str]:
    """Ruta real del camión (áreas que sí necesita, en el orden canónico del
    patio) + 'Salida' al final. trip_row debe exponer los needs_* como atributos
    (sqlalchemy Row o cualquier objeto con getattr)."""
    requeridas = {
        area for campo, area in NEED_FIELD_TO_AREA.items()
        if getattr(trip_row, campo, None)
    }
    ruta = [area for area in WORKFLOW_ORDER if area in requeridas]
    ruta.append("Salida")
    return ruta


def siguiente_area(area_actual: str, ruta: list[str]) -> str:
    """Área a la que debe avanzar el camión desde area_actual, según su ruta.
    Si area_actual no está en la ruta esperada (dato legado / movimiento fuera
    de flujo), se manda al primer paso de la ruta en vez de fallar."""
    if not ruta:
        return "Salida"
    if area_actual not in ruta:
        return ruta[0]
    i = ruta.index(area_actual)
    return ruta[i + 1] if i + 1 < len(ruta) else "Salida"
