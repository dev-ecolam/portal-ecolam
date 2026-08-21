-- Política: Permitir todo a usuarios logueados en la tabla proyectos_v2
CREATE POLICY "Permitir todo a usuarios autenticados" 
ON proyectos_v2 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);