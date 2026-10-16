ALTER TABLE public.logistica_ecotech 
ADD COLUMN IF NOT EXISTS fecha_solicitud timestamptz,
ADD COLUMN IF NOT EXISTS fecha_asignacion timestamptz,
ADD COLUMN IF NOT EXISTS fecha_recepcion_digital timestamptz,
ADD COLUMN IF NOT EXISTS fecha_envio_fisico timestamptz;