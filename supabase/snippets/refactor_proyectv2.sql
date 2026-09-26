ALTER TABLE public.proyectos_v2 
DROP COLUMN IF EXISTS prioridad;

NOTIFY pgrst, 'reload schema';