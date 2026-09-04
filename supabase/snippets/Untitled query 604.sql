WITH nuevo_usuario AS (
  -- 1. Insertamos en el sistema de autenticación
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
    'cliente@prueba.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
  )
  RETURNING id
)
-- 2. Insertamos su perfil en tu tabla pública
INSERT INTO public.usuarios (id, nombre, empresa, correo, rol, estado_empleado, "plantasAsociadas")
SELECT 
  id, 
  'Cliente de Prueba', 
  'Empresa Local S.A.',
  'cliente@prueba.com', 
  'cliente', 
  'Activo', 
  '[]'::jsonb
FROM nuevo_usuario;