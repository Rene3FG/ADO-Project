# Sistema de Control de Autobuses (SCA)

Sistema web multiusuario para el control operativo de autobuses en el área de mantenimiento de ADO Oaxaca. Digitaliza y centraliza el seguimiento de unidades entre áreas de trabajo, con sincronización bidireccional automática con el archivo Excel en OneDrive/Google Sheets.

Desarrollado como parte del proyecto Practicum I — Universidad Anáhuac Oaxaca, 2026.

---

## Arquitectura

```
Google Sheets (10 hojas)
        ↕
   sync_engine.py        ← corre cada 2 minutos
        ↕
   PostgreSQL (sca_db)
```

El servicio hace **pull** (Sheets → DB) seguido de **push** (DB → Sheets) en cada ciclo. Los conflictos se resuelven con Last Write Wins: si la app modificó un registro más recientemente, el cambio de Sheets se descarta.

---

## Hojas sincronizadas

| Hoja | Tabla PostgreSQL | Descripción |
|---|---|---|
| PLANEACION | `corridas` | Corridas del turno con necesidades por área |
| CENTRAL | `registros`, `checklist_areas` | Estado general y checklist de cada unidad |
| DIESEL | `movimientos` | Movimientos al área de diésel |
| ADDBLUE | `movimientos` | Movimientos al área de AdBlue |
| TALLER | `movimientos`, `taller_detalle` | Taller con subáreas de trabajo |
| DESFOGUE | `movimientos` | Movimientos al área de desfogue |
| LAVADO EXTERIOR | `movimientos` | Lavado exterior |
| LAVADO INTERIOR | `movimientos` | Lavado interior |
| TIEMPOS | `tiempos` | Tiempos de entrada y salida por unidad |
| KPI´S | `kpis_snapshot` | Snapshot de indicadores del turno |

---

## Requisitos

- Python 3.10+
- PostgreSQL 14+
- Cuenta de servicio de Google con acceso a la Spreadsheet

---

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Rene3FG/ADO-Project.git
   cd ADO-Project
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

Crea un archivo `.env` con los siguientes valores:

```env
SPREADSHEET_ID=<ID del Google Sheet>
GOOGLE_CREDS_FILE=credentials/service_account.json
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/sca_db
SYNC_INTERVAL_SECONDS=120
CONFLICT_THRESHOLD_SECONDS=10
```

| Variable | Descripción | Default |
|---|---|---|
| `SPREADSHEET_ID` | ID del Google Sheet (en la URL) | — |
| `GOOGLE_CREDS_FILE` | Ruta al JSON de la cuenta de servicio | `credentials/service_account.json` |
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://sca_user:password@localhost:5432/sca_db` |
| `SYNC_INTERVAL_SECONDS` | Segundos entre ciclos de sincronización | `120` |
| `CONFLICT_THRESHOLD_SECONDS` | Margen en segundos para resolver conflictos | `10` |

---

## Uso

Inicia el servicio de sincronización:

```bash
python main.py
```

El servicio ejecuta un ciclo inmediatamente al arrancar y luego repite cada `SYNC_INTERVAL_SECONDS` segundos. Los logs se guardan en `logs/sca_YYYY-MM-DD.log` con rotación diaria y retención de 7 días.

---

## Equipo

- Rosaura Quintana Fenochio
- Jimena Morales Villagómez
- René Fuentes Guzmán
- Sebastián Morales Villagómez
- Luis Daniel Acevedo Herrera
- Alejandro Cinco Prieto
