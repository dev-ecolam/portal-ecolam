ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS estado_empleado TEXT DEFAULT 'Activo', -- Activo, Baja, Suspendido
ADD COLUMN IF NOT EXISTS tipo_contrato TEXT DEFAULT 'Indeterminado', -- Prueba, Determinado, Indeterminado, Asimilado
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS nss TEXT, -- Número de Seguridad Social
ADD COLUMN IF NOT EXISTS rfc TEXT,
ADD COLUMN IF NOT EXISTS salario_mensual NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS documentos_legales JSONB DEFAULT '[]'::jsonb; -- Para guardar URLs de INE, Contrato, etc.