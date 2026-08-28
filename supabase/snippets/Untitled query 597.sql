-- 1. Tabla de Días Festivos
CREATE TABLE dias_festivos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fecha DATE NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT DEFAULT 'Oficial',
    repetir_anualmente BOOLEAN DEFAULT true
);

-- 2. Tabla de Vacaciones y Ausencias (Reemplaza el Array de Firebase)
CREATE TABLE ausencias_vacaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_habiles NUMERIC(5,1) NOT NULL,
    motivo TEXT,
    tipo TEXT DEFAULT 'Vacaciones', -- Vacaciones, Permiso, Incapacidad, Manual (RH)
    estado TEXT DEFAULT 'Aprobado', -- Pendiente RH, Pendiente Supervisor, Aprobado, Rechazado
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LA NUEVA TABLA: Registro de Asistencias (Checadas)
CREATE TABLE asistencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    minutos_retardo INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'Asistencia', -- Asistencia, Retardo, Falta, Justificado
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, fecha) -- Un empleado solo puede tener un registro por día
);

-- 4. Actualizar la tabla de usuarios con los campos de RH
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS fecha_ingreso DATE,
ADD COLUMN IF NOT EXISTS dias_acumulados_anteriores NUMERIC(5,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_tomados_manuales NUMERIC(5,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS horario_laboral JSONB DEFAULT '{}'::jsonb;