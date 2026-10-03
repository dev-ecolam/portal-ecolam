UPDATE proyectos_v2
SET 
    estado = 'activo',
    estado_operativo = 'En Proceso',
    url_estudio_r2 = NULL,
    fecha_fin_tecnico_real = NULL,
    notas_supervisor = 'Reiniciado para prueba de flujo'
WHERE npu = '001-0001-00-00526'; -- Reemplaza con tu NPU