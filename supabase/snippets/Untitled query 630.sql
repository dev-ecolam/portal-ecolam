-- ==============================================================================
-- RELACIÓN MUCHOS A MUCHOS: USUARIOS <-> CLIENTES (PLANTAS)
-- ==============================================================================

CREATE TABLE usuario_clientes (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, cliente_id)
);

-- Crear un índice para que el frontend encuentre rapidísimo a qué plantas tiene acceso un usuario
CREATE INDEX idx_usuario_clientes_usuario ON usuario_clientes (usuario_id);

-- Activar RLS para seguridad
ALTER TABLE usuario_clientes ENABLE ROW LEVEL SECURITY;

-- Política de prueba para desarrollo local
CREATE POLICY "Permitir todo a usuarios autenticados en usuario_clientes" 
ON usuario_clientes 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);