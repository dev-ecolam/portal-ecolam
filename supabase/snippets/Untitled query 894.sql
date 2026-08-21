-- Agregar campos de control a Servicios
ALTER TABLE servicios 
ADD COLUMN servicio_id_numerico TEXT,
ADD COLUMN dependencia TEXT,
ADD COLUMN calculo_duracion JSONB;

-- Agregar campos de control a Proveedores
ALTER TABLE proveedores 
ADD COLUMN proveedor_id_numerico TEXT;

-- Agregar campos de control a Clientes
ALTER TABLE clientes 
ADD COLUMN cliente_id_numerico TEXT,
ADD COLUMN logo_url TEXT;

-- Agregar campos de control y finanzas a Proyectos
ALTER TABLE proyectos_v2 
ADD COLUMN npu TEXT,
ADD COLUMN prioridad TEXT DEFAULT '1 - Normal',
ADD COLUMN precio_cotizacion_cliente NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN costo_proveedor NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN horas_estimadas NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN horas_registradas NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN fase_facturacion TEXT DEFAULT 'N/A',
ADD COLUMN cotizacion_cliente_ref TEXT,
ADD COLUMN po_cliente_ref TEXT,
ADD COLUMN cotizacion_proveedor_ref TEXT,
ADD COLUMN po_proveedor TEXT,
ADD COLUMN cantidad_unidades NUMERIC(10, 2),
ADD COLUMN comentarios_apertura TEXT,
ADD COLUMN fecha_asignacion_tecnico TIMESTAMP WITH TIME ZONE,
ADD COLUMN fecha_entrega_interna TIMESTAMP WITH TIME ZONE,
ADD COLUMN notas_supervisor TEXT,
ADD COLUMN fecha_fin_tecnico_real TIMESTAMP WITH TIME ZONE;

-- Crear tabla para manejar el contador consecutivo del NPU de forma segura
CREATE TABLE contadores_npu (
    anio INTEGER PRIMARY KEY,
    consecutivo INTEGER DEFAULT 0
);