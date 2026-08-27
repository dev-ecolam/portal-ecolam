ALTER TABLE proyectos_v2
-- Para el seguimiento de Acuses y Vigencia
ADD COLUMN esperando_acuse BOOLEAN DEFAULT false,
ADD COLUMN fecha_vigencia DATE,

-- Para seguimiento a Proveedores Genéricos
ADD COLUMN esperando_proveedor BOOLEAN DEFAULT false,
ADD COLUMN fecha_promesa_proveedor DATE,

-- Para el Flujo Especial ECOTECH
ADD COLUMN ecotech_solicitud_enviada BOOLEAN DEFAULT false,
ADD COLUMN ecotech_num_proyecto TEXT,
ADD COLUMN ecotech_fechas_visita TEXT,
ADD COLUMN ecotech_puntos_dia TEXT,
ADD COLUMN ecotech_hojas_campo_url TEXT,
ADD COLUMN ecotech_ppt_url TEXT;