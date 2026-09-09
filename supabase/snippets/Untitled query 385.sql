-- 1. Agregar columnas para los URLs de los PDFs en la tabla proyectos_v2
ALTER TABLE public.proyectos_v2 
ADD COLUMN IF NOT EXISTS url_cotizacion_cliente text,
ADD COLUMN IF NOT EXISTS url_po_cliente text,
ADD COLUMN IF NOT EXISTS url_cotizacion_proveedor text,
ADD COLUMN IF NOT EXISTS url_po_proveedor text;

-- 2. Crear el Bucket de Storage para los documentos (si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos_proyectos', 'documentos_proyectos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de seguridad para que los usuarios autenticados puedan subir y ver archivos
CREATE POLICY "Permitir lectura a autenticados" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos_proyectos');
CREATE POLICY "Permitir subida a autenticados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos_proyectos');
CREATE POLICY "Permitir actualización a autenticados" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documentos_proyectos');

-- 4. Habilitar la extensión pg_cron (si no está habilitada en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 5. Crear la tarea programada (Cron Job) que se ejecuta el 1 de enero de cada año
-- Borra todo registro en proyectos_v2 que tenga más de 5 años desde su fecha de apertura.
SELECT cron.schedule(
  'borrado_historico_5_anios',
  '0 0 1 1 *', -- A la medianoche del 1 de Enero
  $$
  DELETE FROM public.proyectos_v2 
  WHERE fecha_apertura < (now() - interval '5 years');
  $$
);