-- Asegurarnos de que la columna exista realmente
ALTER TABLE public.proyectos_v2 ADD COLUMN IF NOT EXISTS notas_leidas boolean DEFAULT false;

-- Forzar el reinicio de la memoria caché de PostgREST (Supabase)
NOTIFY pgrst, 'reload schema';