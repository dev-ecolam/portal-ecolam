ALTER TABLE public.proyectos_v2 
ADD COLUMN IF NOT EXISTS dias_asignados_tecnico integer DEFAULT 0;