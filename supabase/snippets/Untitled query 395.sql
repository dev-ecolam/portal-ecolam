ALTER TABLE proyectos_v2

-- 1. Control del Ciclo de Vida y Acuses
ADD COLUMN notas_firmadas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN url_pdf_cliente TEXT,
ADD COLUMN estado_dependencia TEXT DEFAULT 'Pendiente',
ADD COLUMN fecha_vigencia DATE,
ADD COLUMN es_entrega_preliminar BOOLEAN DEFAULT false,
ADD COLUMN esperando_acuse BOOLEAN DEFAULT false,

-- 2. Almacenamiento de rutas para poder borrar archivos
ADD COLUMN path_evidencia TEXT,

-- 3. Seguimiento a Proveedores Generales
ADD COLUMN esperando_proveedor BOOLEAN DEFAULT false,
ADD COLUMN fecha_promesa_proveedor DATE,
ADD COLUMN notas_proveedor TEXT,

-- 4. Flujo Exclusivo del Aliado: ECOTECH
ADD COLUMN ecotech_solicitud_enviada BOOLEAN DEFAULT false,
ADD COLUMN ecotech_fechas_visita TEXT,
ADD COLUMN ecotech_puntos_dia TEXT,
ADD COLUMN ecotech_num_proyecto TEXT,
ADD COLUMN ecotech_pdf_proyecto TEXT,
ADD COLUMN ecotech_hojas_campo_url TEXT,
ADD COLUMN ecotech_ppt_url TEXT,
ADD COLUMN ecotech_guia_envio TEXT,
ADD COLUMN ecotech_guia_regreso TEXT,
ADD COLUMN ecotech_estatus TEXT DEFAULT 'Pendiente de Solicitud';