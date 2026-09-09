ALTER TABLE public.contadores_npu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.contadores_npu;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.contadores_npu FOR ALL TO authenticated USING (true) WITH CHECK (true);