ALTER TABLE public.proyectos_v2 
DROP COLUMN IF EXISTS fecha_vigencia;

NOTIFY pgrst, 'reload schema';