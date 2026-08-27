CREATE TABLE documentos_clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nombre_archivo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    url_archivo TEXT NOT NULL,
    path_archivo TEXT NOT NULL,
    subido_por UUID REFERENCES usuarios(id),
    solicitud_borrado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);