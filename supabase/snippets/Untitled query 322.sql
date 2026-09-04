-- Eliminar el rastro del ID numérico del cliente
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS cliente_id_numerico;
ALTER TABLE public.clientes DROP COLUMN IF EXISTS cliente_id_numerico;

-- Habilitar RLS y dar permisos totales en la tabla usuarios para que el UPDATE funcione
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.usuarios;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);