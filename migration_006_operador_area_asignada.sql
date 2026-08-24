-- Migración 006: Área asignada por operador
-- El admin asigna un área fija a cada operador; el backend la usa para
-- restringir qué camiones puede ver/mover (server-side, no solo UI).

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS assigned_area_id INTEGER REFERENCES area(id);
