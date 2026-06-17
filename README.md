# Sistema de Control de Autobuses (SCA)

Sistema web multiusuario para el control operativo de autobuses en el área de mantenimiento de ADO Oaxaca. Digitaliza y centraliza el seguimiento de unidades entre áreas de trabajo, con sincronización bidireccional automática con el archivo Excel en Google Sheets.

Desarrollado como parte del proyecto Practicum I — Universidad Anáhuac Oaxaca, 2026.

Este repositorio (`Excel`) es el backend de datos: el motor de sincronización con Google Sheets y la API REST que consumen los frontends de los equipos de Diseño y Formularios.

---

## Arquitectura

```
Drag & Drop UI (Diseño)     Forms UI (Formularios)
        │                           │
        └──────────┬────────────────┘
                   │ HTTP REST
           ┌───────▼────────┐
           │   SCA API      │  SCA_API.ipynb (FastAPI, puerto 8000)
           └───────┬────────┘
                   │ SQLAlchemy
           ┌───────▼────────┐
           │  Supabase DB   │  PostgreSQL cloud, compartida con los 3 equipos
           └───────┬────────┘
                   │ sync_engine.py (vía main.py, cada 2 minutos)
           ┌───────▼────────┐
           │ Google Sheets  │  10 hojas (PLANEACION, CENTRAL, DIESEL, ...)
           └────────────────┘
```

El servicio `main.py` hace **pull** (Sheets → DB) seguido de **push** (DB → Sheets) en cada ciclo. Los conflictos se resuelven con Last Write Wins: si la app (vía la API) modificó un registro más recientemente, el cambio de Sheets se descarta.

Toda escritura desde la API marca `is_dirty=true, last_modified_by='app'`; el sync engine detecta esos registros y los sube a Sheets en el siguiente ciclo.

---

## Hojas sincronizadas

Nombres de tabla reales en Supabase (en inglés — el schema original en español fue reemplazado por el equipo de Diseño/Formularios al compartir el proyecto Supabase):

| Hoja | Tabla(s) PostgreSQL | Descripción |
|---|---|---|
| PLANEACION | `trips` | Corridas del turno con necesidades por área |
| CENTRAL | `records`, `area_checklists` | Estado general y checklist de cada unidad |
| DIESEL | `movements` | Movimientos al área de diésel |
| ADDBLUE | `movements` | Movimientos al área de AdBlue |
| TALLER | `movements`, `workshop_details` | Taller con subáreas de trabajo |
| DESFOGUE | `movements` | Movimientos al área de desfogue |
| LAVADO EXTERIOR | `movements` | Lavado exterior |
| LAVADO INTERIOR | `movements` | Lavado interior |
| TIEMPOS | `times` | Tiempos de entrada y salida por unidad |
| KPI´S | `kpis__snapshot` | Snapshot de indicadores del turno |

Lookups: `bus_types` (AU, SUR, TXO, ETN, ADO, PLATINO), `area` (DIESEL, ADDBLUE, WORKSHOP, DRAINAGE, EXTERIOR WASH, INTERIOR WASH, RECEPTION). Cierre de turno: `shift_closures`. Log de cada ciclo PULL/PUSH: `sync_logs`. Ver `schema.sql` para el DDL completo documentado.

---

## Requisitos

- Python 3.10+
- Una base de datos PostgreSQL en [Supabase](https://supabase.com) (proyecto compartido con Diseño/Formularios)
- Cuenta de servicio de Google con acceso a la Spreadsheet

---

## Instalación

1. Clona el repositorio y cambia a la rama `Excel`:
   ```bash
   git clone https://github.com/Rene3FG/ADO-Project.git
   cd ADO-Project
   git checkout Excel
   ```

2. Instala dependencias:
   ```bash
   pip install -r requirements.txt
   ```

3. Coloca el archivo de credenciales de la cuenta de servicio de Google en:
   ```
   credentials/service_account.json
   ```

4. Crea un archivo `.env` en la raíz del proyecto (ver sección siguiente).

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Supabase — conexión DIRECTA (puerto 5432), NO el pooler (6543)
DATABASE_URL=postgresql://postgres:[TU-PASSWORD]@db.[TU-PROJECT-REF].supabase.co:5432/postgres

SPREADSHEET_ID=1bHoYKL5U14JfmhwwoLMHwzOtGbFbA_1sRF75P5G18sY
GOOGLE_CREDS_FILE=credentials/service_account.json
SYNC_INTERVAL_SECONDS=120
CONFLICT_THRESHOLD_SECONDS=10
```

| Variable | Descripción | Default |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión a Supabase (puerto 5432 directo) | `postgresql://sca_user:password@localhost:5432/sca_db` |
| `SPREADSHEET_ID` | ID del Google Sheet (en la URL) | — |
| `GOOGLE_CREDS_FILE` | Ruta al JSON de la cuenta de servicio | `credentials/service_account.json` |
| `SYNC_INTERVAL_SECONDS` | Segundos entre ciclos de sincronización | `120` |
| `CONFLICT_THRESHOLD_SECONDS` | Margen en segundos para resolver conflictos | `10` |

---

## Uso

### Sync engine (Sheets ↔ Supabase)

```bash
python main.py
```

Ejecuta un ciclo inmediatamente al arrancar y luego repite cada `SYNC_INTERVAL_SECONDS` segundos. Los logs se guardan en `logs/sync_*.log` con rotación diaria y retención de 7 días.

### API REST (consumida por Diseño y Formularios)

Abre `SCA_API.ipynb` en Jupyter y corre las celdas en orden. Levanta un servidor FastAPI en `http://0.0.0.0:8000` (daemon thread, el notebook sigue interactivo):

- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Comparte `http://<tu-IP>:8000` con los otros equipos mientras estés en la misma red. Ver la última celda del notebook para el contrato de escritura y la lista de endpoints.

---
