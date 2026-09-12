ALTER TABLE public.proyectos_v2 
ADD COLUMN IF NOT EXISTS estado_operativo VARCHAR(50) DEFAULT 'Pendiente';