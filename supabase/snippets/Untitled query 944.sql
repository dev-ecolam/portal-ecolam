CREATE TABLE agenda_tecnicos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tecnico_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    proyecto_id UUID REFERENCES proyectos_v2(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    tipo TEXT DEFAULT 'visita', -- visita, llamada, tramite, vacaciones
    fecha_evento DATE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
