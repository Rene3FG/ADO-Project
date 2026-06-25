-- migration_004_times_num_precision.sql
--
-- PROBLEMA: exit_time_num y entry_time_num estaban definidas como
-- NUMERIC(10,6) — solo 4 dígitos antes del decimal (máx 9999.999999).
-- El Sheet envía seriales completos de Excel con fecha+hora (ej. 46194.46...)
-- que tienen 5 dígitos enteros → overflow y NumericValueOutOfRange en cada
-- fila de TIEMPOS con hora de salida registrada.
--
-- FIX: ampliar a NUMERIC(15,6) — hasta 9 dígitos enteros (safe para seriales
-- de Excel hasta el año ~2157) sin pérdida de datos existentes.

ALTER TABLE times
  ALTER COLUMN exit_time_num  TYPE NUMERIC(15,6),
  ALTER COLUMN entry_time_num TYPE NUMERIC(15,6);
