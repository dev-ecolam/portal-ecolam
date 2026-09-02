CREATE TABLE IF NOT EXISTS public.contadores_npu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anio INTEGER UNIQUE NOT NULL,
    consecutivo INTEGER NOT NULL DEFAULT 1
);
GRANT ALL ON public.contadores_npu TO anon, authenticated;