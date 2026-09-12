-- Agregamos la columna para vincular al técnico
ALTER TABLE public.proyectos_v2 
ADD COLUMN IF NOT EXISTS tecnico_id uuid REFERENCES public.usuarios(id);

-- Nos aseguramos de que fecha_entrega_interna exista
ALTER TABLE public.proyectos_v2 
ADD COLUMN IF NOT EXISTS fecha_entrega_interna date;