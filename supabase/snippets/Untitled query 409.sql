ALTER TABLE public.proyectos_v2 
ADD COLUMN IF NOT EXISTS tipo_entrega text,
ADD COLUMN IF NOT EXISTS fecha_vencimiento date,
ADD COLUMN IF NOT EXISTS fecha_fin_tecnico_real timestamptz;

-- Recargamos el caché por si acaso
NOTIFY pgrst, 'reload schema';