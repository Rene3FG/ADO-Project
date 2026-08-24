-- Migración 007: Tags NFC
-- Mapeo tag físico (UID) <-> camión, para registrar entrada automática al
-- pasar de una etapa a la siguiente. Un tag activo por camión (v1, sin
-- historial de reasignaciones).

CREATE TABLE IF NOT EXISTS nfc_tags (
    id            SERIAL PRIMARY KEY,
    tag_uid       TEXT UNIQUE NOT NULL,
    serial_number INTEGER NOT NULL,
    assigned_at   TIMESTAMPTZ DEFAULT now(),
    assigned_by   TEXT
);
