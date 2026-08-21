-- Control de bajas para Servicios
ALTER TABLE servicios 
ADD COLUMN activo BOOLEAN DEFAULT true,
ADD COLUMN fecha_baja TIMESTAMP WITH TIME ZONE;

-- Control de bajas para Proveedores
ALTER TABLE proveedores 
ADD COLUMN activo BOOLEAN DEFAULT true,
ADD COLUMN fecha_baja TIMESTAMP WITH TIME ZONE;

-- Índices para que las consultas de "Solo Activos" vuelen
CREATE INDEX idx_servicios_activos ON servicios(activo);
CREATE INDEX idx_proveedores_activos ON proveedores(activo);