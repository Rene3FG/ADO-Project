"""Reloj único del SCA: hora local de Oaxaca (America/Mexico_City).

Convención de la base: las columnas TIMESTAMPTZ guardan la hora de pared local
etiquetada como UTC (así llegan las filas de Google Sheets). El servidor de
Render y GitHub Actions corren en UTC, así que datetime.now()/date.today()
darían 6 h de más; todo el código debe usar estas funciones.
"""
from datetime import datetime, date
from zoneinfo import ZoneInfo

TZ_LOCAL = ZoneInfo("America/Mexico_City")


def ahora() -> datetime:
    """Hora de pared local, sin tzinfo (misma convención que los datos de Sheets)."""
    return datetime.now(TZ_LOCAL).replace(tzinfo=None)


def hoy() -> date:
    return ahora().date()
