-- Agregamos un indicador de si el empleado sigue en la empresa
ALTER TABLE usuarios 
ADD COLUMN activo BOOLEAN DEFAULT true,
ADD COLUMN fecha_baja TIMESTAMP WITH TIME ZONE;

-- (Opcional pero recomendado) Índice para buscar rápidamente solo a los activos
CREATE INDEX idx_usuarios_activos ON usuarios(activo);