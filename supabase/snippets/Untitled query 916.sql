ALTER TABLE public.plantas
ADD COLUMN IF NOT EXISTS nombre_comercial text,
ADD COLUMN IF NOT EXISTS rfc text,
ADD COLUMN IF NOT EXISTS domicilio_fiscal text,
ADD COLUMN IF NOT EXISTS ciudad_estado text,
ADD COLUMN IF NOT EXISTS contacto_encargado text,
ADD COLUMN IF NOT EXISTS puesto_contacto text,
ADD COLUMN IF NOT EXISTS telefono_contacto text,
ADD COLUMN IF NOT EXISTS correo_contacto text,
ADD COLUMN IF NOT EXISTS giro_empresa text,
ADD COLUMN IF NOT EXISTS representante_legal text,
ADD COLUMN IF NOT EXISTS peticion_modificacion boolean DEFAULT false;

NOTIFY pgrst, 'reload schema';