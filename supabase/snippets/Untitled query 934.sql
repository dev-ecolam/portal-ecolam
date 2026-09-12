-- Nos aseguramos de que las columnas correctas existen
ALTER TABLE public.bitacoras_proyectos ADD COLUMN IF NOT EXISTS autor_id uuid;
ALTER TABLE public.bitacoras_proyectos ADD COLUMN IF NOT EXISTS mensaje text;

-- Eliminamos la llave foránea si existía con otro nombre para evitar conflictos
ALTER TABLE public.bitacoras_proyectos DROP CONSTRAINT IF EXISTS fk_bitacoras_autor;

-- Forzamos la relación entre la bitácora y el usuario
ALTER TABLE public.bitacoras_proyectos 
ADD CONSTRAINT fk_bitacoras_autor 
FOREIGN KEY (autor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;