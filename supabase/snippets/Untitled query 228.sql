-- 1. SOLUCIONAR ERROR 400: Agregar la columna faltante en usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS empresa text;

-- 2. SOLUCIONAR ERRORES 403: Habilitar RLS y crear políticas de acceso total para usuarios autenticados
-- Para Plantas
ALTER TABLE public.plantas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.plantas;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.plantas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para Servicios
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.servicios;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.servicios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para Proveedores
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.proveedores;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. INSERTAR REGISTROS INTERNOS "00" (Inborrables)
-- Proveedor Interno
INSERT INTO public.proveedores (nombre_proveedor, proveedor_id_numerico, estado) 
VALUES ('INTERNO ECOLAM', '00', 'Activo');

-- Servicio Interno
INSERT INTO public.servicios (nombre_servicio, servicio_id_numerico, dependencia, estado) 
VALUES ('SERVICIO INTERNO', '00', 'Ninguna', 'Activo');