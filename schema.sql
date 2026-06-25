-- ═══════════════════════════════════════════════════════════
--  SCA — Schema PostgreSQL (Supabase)
--
--  Refleja el schema REAL en Supabase a 2026-06-17 (nombres en
--  inglés). El schema original en español fue reemplazado por
--  este — probablemente por el equipo de Diseño/Formularios,
--  que comparte el mismo proyecto Supabase — y agregó las
--  tablas de auth (roles/users/user_sessions/activity_logs).
--
--  Las tablas marcadas "ADITIVO — pendiente de aplicar" no
--  existen todavía; están en migration_002_sync_tracking.sql.
--  Ese archivo es el que hay que pegar en Supabase Dashboard →
--  SQL Editor → Run. Este schema.sql es solo documentación, no
--  se ejecuta contra una base ya poblada.
-- ═══════════════════════════════════════════════════════════

-- ── LOOKUPS ────────────────────────────────────────────────

CREATE TABLE bus_types (
    id   SERIAL PRIMARY KEY,
    name TEXT   NOT NULL UNIQUE
);

CREATE TABLE area (
    id   SERIAL PRIMARY KEY,
    name TEXT   NOT NULL UNIQUE
);
-- Nota: no tiene "orden_flujo". El orden de áreas al reconstruir CENTRAL
-- (sync_engine._push_central) se resuelve en Python (db_client.AREA_NOMBRE_DB),
-- no en la base.

-- ── PLANEACIÓN (Sheet: PLANEACION) ─────────────────────────

CREATE TABLE trips (
    id               SERIAL      PRIMARY KEY,
    date             DATE        NOT NULL DEFAULT CURRENT_DATE,
    serial_number    INTEGER     NOT NULL,
    type_id          INTEGER     REFERENCES bus_types(id),
    scheduled_time   TIME,
    departure_time   TIME,
    needs_reception  SMALLINT    DEFAULT 0,
    needs_drainage   SMALLINT    DEFAULT 0,
    needs_diesel     SMALLINT    DEFAULT 0,
    needs_adblue     SMALLINT    DEFAULT 0,
    needs_ext_wash   SMALLINT    DEFAULT 0,
    needs_int_wash   SMALLINT    DEFAULT 0,
    needs_workshop   SMALLINT    DEFAULT 0,
    sheets_row       INTEGER,
    is_dirty         BOOLEAN     NOT NULL DEFAULT false,
    last_modified_by TEXT        NOT NULL DEFAULT 'sheets',
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sheets_synced_at TIMESTAMPTZ,
    UNIQUE (date, serial_number)
);

-- ── CENTRAL (Sheet: CENTRAL) ────────────────────────────────

CREATE TABLE records (
    id                SERIAL      PRIMARY KEY,
    date              DATE        NOT NULL DEFAULT CURRENT_DATE,
    serial_number     INTEGER     NOT NULL,
    type_id           INTEGER     REFERENCES bus_types(id),
    shift             SMALLINT,
    is_active         BOOLEAN     NOT NULL DEFAULT true,
    registration_time TIMESTAMPTZ,
    location_text     TEXT,
    time_remaining    NUMERIC(6,2),
    progress          NUMERIC(5,2),
    sheets_row        INTEGER,
    is_dirty          BOOLEAN     NOT NULL DEFAULT false,
    last_modified_by  TEXT        NOT NULL DEFAULT 'sheets',
    last_modified_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    sheets_synced_at  TIMESTAMPTZ,
    UNIQUE (date, serial_number)
);

CREATE TABLE area_checklists (
    id         SERIAL  PRIMARY KEY,
    record_id  INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
    area_id    INTEGER NOT NULL REFERENCES area(id),
    is_checked BOOLEAN NOT NULL DEFAULT false,
    quantity   SMALLINT,
    UNIQUE (record_id, area_id)
);
-- Nota: no tiene columnas de tracking (is_dirty/last_modified_by). El Sheet
-- siempre gana al hacer pull; no hay protección "last write wins" aquí.

-- ── MOVIMIENTOS (Sheets: DIESEL, ADDBLUE, TALLER, etc.) ────

CREATE TABLE movements (
    id               SERIAL      PRIMARY KEY,
    record_id        INTEGER     NOT NULL REFERENCES records(id),
    area_id          INTEGER     NOT NULL REFERENCES area(id),
    serial_number    INTEGER     NOT NULL,
    date             DATE        NOT NULL DEFAULT CURRENT_DATE,
    entry_time       TIME,
    exit_time        TIMESTAMPTZ,
    is_completed     BOOLEAN     NOT NULL DEFAULT false,
    duration_days    NUMERIC(8,4),
    sheets_row       INTEGER,
    is_dirty         BOOLEAN     NOT NULL DEFAULT false,
    last_modified_by TEXT        NOT NULL DEFAULT 'sheets',
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sheets_synced_at TIMESTAMPTZ
);

CREATE TABLE workshop_details (
    id                      SERIAL  PRIMARY KEY,
    movement_id             INTEGER NOT NULL REFERENCES movements(id) ON DELETE CASCADE,
    tires                   BOOLEAN DEFAULT false,
    preventive_maintenance  BOOLEAN DEFAULT false,
    alignment_pit           BOOLEAN DEFAULT false,
    air_conditioning        BOOLEAN DEFAULT false,
    oil_change              BOOLEAN DEFAULT false,
    transmission_inspection BOOLEAN DEFAULT false,
    brakes_inspection       BOOLEAN DEFAULT false,
    engine                  BOOLEAN DEFAULT false,
    battery_check           BOOLEAN DEFAULT false,
    shock_absorbers         BOOLEAN DEFAULT false,
    electrical              BOOLEAN DEFAULT false,
    vans                    BOOLEAN DEFAULT false,
    upholstery              BOOLEAN DEFAULT false,
    bodywork_peripherals    BOOLEAN DEFAULT false,
    paint_peripherals       BOOLEAN DEFAULT false,
    paint_pinflo            BOOLEAN DEFAULT false,
    bodywork_pinflo         BOOLEAN DEFAULT false,
    progress_percentage     NUMERIC(5,2)
);
-- Nota: oil_change/battery_check/shock_absorbers no tienen columna origen
-- en el Sheet TALLER todavía (ver mapping.py). Sin UNIQUE(movement_id):
-- el upsert se hace a mano (SELECT + INSERT/UPDATE) en sync_engine.

-- ── TIEMPOS (Sheet: TIEMPOS) ────────────────────────────────

CREATE TABLE times (
    id               SERIAL  PRIMARY KEY,
    serial_number    INTEGER NOT NULL UNIQUE,
    entry_time       TIME,
    is_completed     BOOLEAN     DEFAULT false,
    exit_time_num    NUMERIC(15,6),   -- serial completo Excel fecha+hora (ej. 46194.46...)
    entry_time_num   NUMERIC(15,6),   -- NUMERIC(10,6) era demasiado pequeño (migration_004)
    duration_days    NUMERIC(8,4)
    -- sheets_row, is_dirty, last_modified_by, last_modified_at, sheets_synced_at:
    -- ADITIVO — pendiente de aplicar, ver migration_002_sync_tracking.sql
);

-- ── KPIs (Sheet: KPI'S) ─────────────────────────────────────

CREATE TABLE kpis__snapshot (
    id                              SERIAL      PRIMARY KEY,
    captured_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_buses                     INTEGER,
    buses_needing_workshop          INTEGER,
    released_buses                  INTEGER,
    serviced_buses                  INTEGER,
    buses_in_bays                   INTEGER,
    foreign_buses                   INTEGER,
    buses_needing_wash              INTEGER,
    priority_units_completed        INTEGER,
    mechanics_count                 NUMERIC(6,2),
    total_bay_capacity              NUMERIC(6,2),
    pct_needing_workshop            NUMERIC(6,4),
    pct_released                    NUMERIC(6,4),
    workload_per_mechanic           NUMERIC(6,4),
    bay_utilization                 NUMERIC(6,4),
    foreign_bus_flow                NUMERIC(6,4),
    pct_needing_wash                NUMERIC(6,4),
    priority_compliance             NUMERIC(6,4)
);
-- Nota: no tiene "fecha" ni "sheets_synced_at"; cada pull es un INSERT nuevo
-- con captured_at=now().

-- ── CIERRE DE TURNO ─────────────────────────────────────────

CREATE TABLE shift_closures (
    id                  SERIAL      PRIMARY KEY,
    date                DATE        NOT NULL DEFAULT CURRENT_DATE,
    shift               SMALLINT    NOT NULL,
    closed_by           INTEGER,
    records_snapshot    JSONB,
    movements_snapshot  JSONB,
    archived_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── SYNC LOG ─────────────────────────────────────────────────
-- ADITIVO — pendiente de aplicar, ver migration_002_sync_tracking.sql

CREATE TABLE sync_logs (
    id          SERIAL      PRIMARY KEY,
    sheet       TEXT        NOT NULL,
    direction   TEXT        NOT NULL,
    errors      JSONB,
    started_at  TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL,
    success     BOOLEAN     NOT NULL
);

-- ── DATOS INICIALES ─────────────────────────────────────────

INSERT INTO bus_types (name) VALUES
    ('AU'), ('SUR'), ('TXO'), ('ETN'), ('ADO'), ('PLATINO');

INSERT INTO area (name) VALUES
    ('DIESEL'), ('ADDBLUE'), ('WORKSHOP'), ('DRAINAGE'),
    ('EXTERIOR WASH'), ('INTERIOR WASH'), ('RECEPTION');

-- ── TABLAS DE OTRO DOMINIO (no las toca el sync de Excel) ──
-- Pertenecen al login/auditoría de la app (equipo Diseño/Formularios).
-- Se documentan aquí solo para referencia, no se crean desde este archivo.
--
-- roles(id, name)
-- users(id, role_id, username, password_hash, first_name, last_name,
--       is_active, shift_start_time, shift_end_time, created_at)
-- user_sessions(id, user_id, login_time, logout_time, is_on_time)
-- activity_logs(id, user_id, action_type, target_record_id, description, created_at)
