-- 1. Actualizar tabla SERVICIOS
ALTER TABLE public.servicios ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo';
ALTER TABLE public.servicios ADD COLUMN IF NOT EXISTS dependencia TEXT DEFAULT 'Ninguna / Control Interno';
-- Actualizamos los servicios viejos que no tenían estado
UPDATE public.servicios SET estado = 'Activo' WHERE estado IS NULL;

-- 2. Actualizar tabla PLANTAS
ALTER TABLE public.plantas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo';
-- Actualizamos las plantas viejas
UPDATE public.plantas SET estado = 'Activo' WHERE estado IS NULL;

-- 3. Actualizar tabla PROVEEDORES
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo';
-- Actualizamos proveedores viejos
UPDATE public.proveedores SET estado = 'Activo' WHERE estado IS NULL;

-- 4. Actualizar tabla USUARIOS (Para clientes)
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS estado_empleado TEXT DEFAULT 'Activo';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS cliente_id_numerico TEXT;
-- Aseguramos que plantasAsociadas pueda guardar arrays (usamos JSONB para mayor compatibilidad de arreglos)
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS "plantasAsociadas" JSONB DEFAULT '[]'::jsonb;
-- Actualizamos usuarios viejos
UPDATE public.usuarios SET estado_empleado = 'Activo' WHERE estado_empleado IS NULL;