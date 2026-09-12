-- Asegurarnos de que RLS está activo
ALTER TABLE public.bitacoras_proyectos ENABLE ROW LEVEL SECURITY;

-- Política para permitir que cualquier usuario logueado pueda LEER la bitácora
CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON public.bitacoras_proyectos 
FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir que cualquier usuario logueado pueda ESCRIBIR en la bitácora
CREATE POLICY "Permitir inserción a usuarios autenticados" 
ON public.bitacoras_proyectos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);