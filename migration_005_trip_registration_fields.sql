-- Migración 005: Campos de registro de autobús en trips
-- Agrega conductor, terminal de origen/destino, observaciones a trips.
-- También aplica UNIQUE constraint a area.name para prevenir duplicados concurrentes.

-- P0.1: campos de registro
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS driver_name          TEXT,
    ADD COLUMN IF NOT EXISTS origin_terminal      TEXT,
    ADD COLUMN IF NOT EXISTS destination_terminal TEXT,
    ADD COLUMN IF NOT EXISTS notes                TEXT;

-- P0.5: constraint única en area.name (la app ya verifica duplicados, pero
-- sin esto hay race condition entre SELECT y el INSERT).
-- Si ya existe la constraint, este comando falla inofensivamente; ejecutar
-- solo si no existe:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'area_name_unique' AND conrelid = 'area'::regclass
    ) THEN
        ALTER TABLE area ADD CONSTRAINT area_name_unique UNIQUE (name);
    END IF;
END $$;
