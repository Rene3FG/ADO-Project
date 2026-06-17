-- ═══════════════════════════════════════════════════════════
--  Migración 002 — agrega lo que falta para que el sync engine
--  funcione contra el schema en inglés ya aplicado en Supabase.
--  100% aditivo: solo crea una tabla nueva y agrega columnas a
--  "times", que es de uso exclusivo del sync de Excel. No toca
--  ninguna tabla del equipo de Diseño/Formularios (users, roles,
--  user_sessions, activity_logs) ni cambia datos existentes.
--  Pegar en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- "times" nunca tuvo columnas para rastrear sync (ni en el schema
-- en español original). Sin esto, _push_tiempos no puede saber qué
-- filas modificó la app ni a qué fila del Sheet escribir.
ALTER TABLE times ADD COLUMN IF NOT EXISTS sheets_row       INTEGER;
ALTER TABLE times ADD COLUMN IF NOT EXISTS is_dirty         BOOLEAN     NOT NULL DEFAULT false;
ALTER TABLE times ADD COLUMN IF NOT EXISTS last_modified_by TEXT        NOT NULL DEFAULT 'sheets';
ALTER TABLE times ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE times ADD COLUMN IF NOT EXISTS sheets_synced_at TIMESTAMPTZ;

-- sync_engine._log_sync() inserta un resumen de cada ciclo PULL/PUSH aquí.
CREATE TABLE IF NOT EXISTS sync_logs (
    id          SERIAL      PRIMARY KEY,
    sheet       TEXT        NOT NULL,
    direction   TEXT        NOT NULL,
    errors      JSONB,
    started_at  TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL,
    success     BOOLEAN     NOT NULL
);
