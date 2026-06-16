-- ═══════════════════════════════════════════════════════════
--  SCA — Schema PostgreSQL (Supabase)
--  Pegar completo en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- ── LOOKUPS ────────────────────────────────────────────────

CREATE TABLE tipos_camion (
    id     SERIAL PRIMARY KEY,
    nombre TEXT   NOT NULL UNIQUE
);

CREATE TABLE areas (
    id     SERIAL PRIMARY KEY,
    nombre TEXT   NOT NULL UNIQUE
);

-- ── PLANEACIÓN (Sheet: PLANEACION) ─────────────────────────

CREATE TABLE corridas (
    id               SERIAL      PRIMARY KEY,
    fecha            DATE        NOT NULL DEFAULT CURRENT_DATE,
    serie            INTEGER     NOT NULL,
    tipo_id          INTEGER     REFERENCES tipos_camion(id),
    hora_corrida     TIME,
    hora_salida      TIME,
    need_recepcion   SMALLINT    DEFAULT 0,
    need_desfogue    SMALLINT    DEFAULT 0,
    need_diesel      SMALLINT    DEFAULT 0,
    need_adblue      SMALLINT    DEFAULT 0,
    need_lav_ext     SMALLINT    DEFAULT 0,
    need_lav_int     SMALLINT    DEFAULT 0,
    need_taller      SMALLINT    DEFAULT 0,
    sheets_row       INTEGER,
    is_dirty         BOOLEAN     NOT NULL DEFAULT false,
    last_modified_by TEXT        NOT NULL DEFAULT 'sheets',
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sheets_synced_at TIMESTAMPTZ,
    UNIQUE (fecha, serie)
);

-- ── CENTRAL (Sheet: CENTRAL) ────────────────────────────────

CREATE TABLE registros (
    id               SERIAL      PRIMARY KEY,
    fecha            DATE        NOT NULL DEFAULT CURRENT_DATE,
    serie            INTEGER     NOT NULL,
    tipo_id          INTEGER     REFERENCES tipos_camion(id),
    turno            SMALLINT,
    activo           BOOLEAN     NOT NULL DEFAULT true,
    hora_registro    TIMESTAMPTZ,
    ubicacion_texto  TEXT,
    tiempo_restante  NUMERIC(6,2),
    avance           NUMERIC(5,2),
    sheets_row       INTEGER,
    is_dirty         BOOLEAN     NOT NULL DEFAULT false,
    last_modified_by TEXT        NOT NULL DEFAULT 'sheets',
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sheets_synced_at TIMESTAMPTZ,
    UNIQUE (fecha, serie)
);

CREATE TABLE checklist_areas (
    id          SERIAL   PRIMARY KEY,
    registro_id INTEGER  NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
    area_id     INTEGER  NOT NULL REFERENCES areas(id),
    checked     BOOLEAN  NOT NULL DEFAULT false,
    cantidad    SMALLINT,
    UNIQUE (registro_id, area_id)
);

-- ── MOVIMIENTOS (Sheets: DIESEL, ADDBLUE, TALLER, etc.) ────

CREATE TABLE movimientos (
    id               SERIAL      PRIMARY KEY,
    registro_id      INTEGER     NOT NULL REFERENCES registros(id),
    area_id          INTEGER     NOT NULL REFERENCES areas(id),
    serie            INTEGER     NOT NULL,
    fecha            DATE        NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada     TIME,
    hora_salida      TIMESTAMPTZ,
    completado       BOOLEAN     NOT NULL DEFAULT false,
    duracion_dias    NUMERIC(8,4),
    sheets_row       INTEGER,
    is_dirty         BOOLEAN     NOT NULL DEFAULT false,
    last_modified_by TEXT        NOT NULL DEFAULT 'sheets',
    last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sheets_synced_at TIMESTAMPTZ
);

CREATE TABLE taller_detalle (
    id                   SERIAL  PRIMARY KEY,
    movimiento_id        INTEGER NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
    llantas              BOOLEAN DEFAULT false,
    preventivo           BOOLEAN DEFAULT false,
    fosa_prev_alineacion BOOLEAN DEFAULT false,
    aire_acondicionado   BOOLEAN DEFAULT false,
    transmision_frenos   BOOLEAN DEFAULT false,
    motor                BOOLEAN DEFAULT false,
    electrico            BOOLEAN DEFAULT false,
    camionetas           BOOLEAN DEFAULT false,
    vestidura            BOOLEAN DEFAULT false,
    carroceria_periecos  BOOLEAN DEFAULT false,
    pintura_periecos     BOOLEAN DEFAULT false,
    pintura_pinflo       BOOLEAN DEFAULT false,
    carroceria_pinflo    BOOLEAN DEFAULT false,
    porcentaje_avance    NUMERIC(5,2)
);

-- ── TIEMPOS (Sheet: TIEMPOS) ────────────────────────────────

CREATE TABLE tiempos (
    id               SERIAL  PRIMARY KEY,
    serie            INTEGER NOT NULL UNIQUE,
    hora_entrada     TIME,
    completado       BOOLEAN     DEFAULT false,
    hora_salida_num  NUMERIC(10,6),
    hora_entrada_num NUMERIC(10,6),
    duracion_dias    NUMERIC(8,4)
);

-- ── KPIs (Sheet: KPI'S) ─────────────────────────────────────

CREATE TABLE kpis_snapshot (
    id                              SERIAL      PRIMARY KEY,
    captured_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_camiones                  INTEGER,
    camiones_necesitan_taller       INTEGER,
    camiones_liberados              INTEGER,
    camiones_atendidos              INTEGER,
    camiones_en_andenes             INTEGER,
    camiones_foraneos               INTEGER,
    camiones_necesitan_lavado       INTEGER,
    unidades_prioritarias_cumplidas INTEGER,
    num_mecanicos                   NUMERIC(6,2),
    capacidad_total_andenes         NUMERIC(6,2),
    pct_necesitan_taller            NUMERIC(6,4),
    pct_liberados                   NUMERIC(6,4),
    carga_por_mecanico              NUMERIC(6,4),
    utilizacion_andenes             NUMERIC(6,4),
    flujo_foraneos                  NUMERIC(6,4),
    pct_necesitan_lavado            NUMERIC(6,4),
    cumplimiento_prioridad          NUMERIC(6,4)
);

-- ── CIERRE DE TURNO ─────────────────────────────────────────

CREATE TABLE cierres_turno (
    id                   SERIAL      PRIMARY KEY,
    fecha                DATE        NOT NULL DEFAULT CURRENT_DATE,
    turno                SMALLINT    NOT NULL,
    cerrado_por          INTEGER,
    snapshot_registros   JSONB,
    snapshot_movimientos JSONB,
    archivado_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── DATOS INICIALES ─────────────────────────────────────────

INSERT INTO tipos_camion (nombre) VALUES
    ('AU'), ('SUR'), ('TXO'), ('ETN'), ('ADO'), ('PLATINO');

INSERT INTO areas (nombre) VALUES
    ('DIESEL'), ('ADDBLUE'), ('TALLER'), ('DESFOGUE'),
    ('LAVADO EXTERIOR'), ('LAVADO INTERIOR'), ('RECEPCION');
