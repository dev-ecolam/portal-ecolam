-- 1. Actualizar la tabla de documentos para que use planta_id
ALTER TABLE public.documentos_clientes ADD COLUMN IF NOT EXISTS planta_id uuid;
ALTER TABLE public.documentos_clientes DROP COLUMN IF EXISTS cliente_id;

-- 2. Limpiar columnas obsoletas en la tabla principal de proyectos
ALTER TABLE public.proyectos_v2 DROP COLUMN IF EXISTS cliente_id;

-- 3. Eliminar tablas obsoletas (Mantenemos 'facturas' y las activas)
DROP TABLE IF EXISTS public.usuario_clientes CASCADE;
DROP TABLE IF EXISTS public.proyecto_tecnicos CASCADE;
DROP TABLE IF EXISTS public.registros_de_tiempo CASCADE;
DROP TABLE IF EXISTS public.solicitudes_vacaciones CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.dias_festivos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- Forzar refresco de caché
NOTIFY pgrst, 'reload schema';