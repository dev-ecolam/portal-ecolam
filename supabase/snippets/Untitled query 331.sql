-- Agregamos la columna de fecha con el valor actual por defecto
ALTER TABLE public.bitacoras_proyectos 
ADD COLUMN IF NOT EXISTS creado_en timestamptz DEFAULT now();