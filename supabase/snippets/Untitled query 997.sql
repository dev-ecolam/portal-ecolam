ALTER TABLE public.proyectos_v2 
DROP COLUMN IF EXISTS proveedor_nombre;

-- Forzar el reinicio de la memoria caché de Supabase
NOTIFY pgrst, 'reload schema';