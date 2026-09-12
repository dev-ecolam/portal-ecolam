ALTER TABLE public.proyectos_v2 
ADD COLUMN IF NOT EXISTS ultimo_inicio_proceso timestamptz,
ADD COLUMN IF NOT EXISTS dias_reales_trabajados integer DEFAULT 0;