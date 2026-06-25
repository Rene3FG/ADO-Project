-- ═══════════════════════════════════════════════════════════
--  Migración 003 — agrega capacidad por área para que "Gestor
--  de Áreas" (admin) pueda crear/eliminar áreas con capacidad
--  real, en vez de la lista fija AREAS_PATIO hardcodeada en el
--  frontend. 100% aditiva: solo agrega una columna nullable a
--  "area" y rellena las 7 filas existentes. No toca ninguna
--  tabla del equipo de Diseño/Formularios.
--  Pegar en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

ALTER TABLE area ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- Backfill con las capacidades que hoy vivían solo en
-- src/lib/areasConfig.js (AREAS_PATIO) del frontend.
UPDATE area SET capacity = 3 WHERE name = 'DIESEL'         AND capacity IS NULL;
UPDATE area SET capacity = 2 WHERE name = 'ADDBLUE'        AND capacity IS NULL;
UPDATE area SET capacity = 2 WHERE name = 'WORKSHOP'       AND capacity IS NULL;
UPDATE area SET capacity = 4 WHERE name = 'DRAINAGE'       AND capacity IS NULL;
UPDATE area SET capacity = 4 WHERE name = 'EXTERIOR WASH'  AND capacity IS NULL;
UPDATE area SET capacity = 3 WHERE name = 'INTERIOR WASH'  AND capacity IS NULL;
UPDATE area SET capacity = 4 WHERE name = 'RECEPTION'      AND capacity IS NULL;

-- Cualquier área nueva creada después de esta migración trae su
-- propia capacidad en el INSERT (ver POST /areas), así que no
-- necesita default a nivel de columna.
