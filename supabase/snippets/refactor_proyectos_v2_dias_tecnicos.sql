CREATE OR REPLACE FUNCTION incrementar_contador_notas(anio_actual integer)
RETURNS integer AS $$
DECLARE
    nuevo_consecutivo integer;
BEGIN
    -- Intenta insertar el año en 1. Si el año ya existe, simplemente le suma 1 al valor que tenga.
    INSERT INTO public.contadores_notas (anio, consecutivo)
    VALUES (anio_actual, 1)
    ON CONFLICT (anio) 
    DO UPDATE SET consecutivo = contadores_notas.consecutivo + 1
    RETURNING consecutivo INTO nuevo_consecutivo;
    
    RETURN nuevo_consecutivo;
END;
$$ LANGUAGE plpgsql;