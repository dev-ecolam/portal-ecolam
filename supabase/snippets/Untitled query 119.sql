-- 1. Limpiar y actualizar la tabla de Servicios
ALTER TABLE servicios DROP COLUMN IF EXISTS calculo_duracion;
ALTER TABLE servicios ADD COLUMN dias_habiles_estimados INTEGER DEFAULT 0;

-- 2. Limpiar y actualizar la tabla de Proyectos
ALTER TABLE proyectos_v2 DROP COLUMN IF EXISTS horas_estimadas;
ALTER TABLE proyectos_v2 DROP COLUMN IF EXISTS horas_registradas;
ALTER TABLE proyectos_v2 DROP COLUMN IF EXISTS cantidad_unidades;

ALTER TABLE proyectos_v2 ADD COLUMN dias_habiles_estimados INTEGER DEFAULT 0;
ALTER TABLE proyectos_v2 ADD COLUMN dias_habiles_registrados INTEGER DEFAULT 0;
ALTER TABLE proyectos_v2 ADD COLUMN fecha_activacion TIMESTAMP WITH TIME ZONE;