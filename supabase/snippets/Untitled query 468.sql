-- Asegurarnos de que RLS está activo en la agenda
ALTER TABLE public.agenda_tecnicos ENABLE ROW LEVEL SECURITY;

-- Política para permitir que cualquier usuario logueado pueda LEER la agenda
CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON public.agenda_tecnicos 
FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir que cualquier usuario logueado pueda ESCRIBIR en la agenda
CREATE POLICY "Permitir inserción a usuarios autenticados" 
ON public.agenda_tecnicos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);