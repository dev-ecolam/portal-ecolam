-- 1. Aseguramos que la columna siga siendo un número entero (revertimos lo de los decimales)
ALTER TABLE public.proyectos_v2 
ALTER COLUMN dias_reales_trabajados TYPE integer USING dias_reales_trabajados::integer;

-- 2. Creamos la función que hace el "corte de caja"
CREATE OR REPLACE FUNCTION sumar_dias_tecnicos_nocturno()
RETURNS void AS $$
BEGIN
  -- Solo se ejecuta si hoy es Lunes (1) a Viernes (5). El 0 es Domingo y 6 es Sábado.
  IF EXTRACT(DOW FROM CURRENT_DATE) BETWEEN 1 AND 5 THEN
    UPDATE public.proyectos_v2
    SET dias_reales_trabajados = COALESCE(dias_reales_trabajados, 0) + 1
    WHERE estado_operativo = 'En Proceso';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Programamos la tarea para que corra todos los días a las 23:59 (11:59 PM)
-- Nota: Requiere que la extensión pg_cron esté activada en tu Supabase (Database -> Extensions -> pg_cron)
SELECT cron.schedule(
  'corte_diario_tecnicos',
  '59 23 * * *', 
  'SELECT sumar_dias_tecnicos_nocturno()'
);