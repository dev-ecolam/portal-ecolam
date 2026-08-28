-- 1. Quitar la regla vieja (si la base de datos se queja de que no existe, ignóralo y sigue)
ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_tipo_check;

-- 2. Agregar la nueva regla que incluye 'gasto_operativo'
ALTER TABLE facturas ADD CONSTRAINT facturas_tipo_check CHECK (tipo IN ('cliente', 'proveedor', 'gasto_operativo'));

-- 3. Agregar columnas para categorizar el gasto y tipo de comprobante
ALTER TABLE facturas 
ADD COLUMN categoria_gasto TEXT, -- Ej. Nómina, Gasolina, Renta, etc.
ADD COLUMN tipo_comprobante TEXT DEFAULT 'Factura XML'; -- Factura XML, Ticket, Recibo, Nómina