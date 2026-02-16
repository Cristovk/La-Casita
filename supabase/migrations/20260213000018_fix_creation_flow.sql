-- FIX: Asegurar que el INSERT de households no falle por RLS
-- El error "new row violates row-level security policy for table households" significa que
-- aunque tenemos una política para INSERT WITH CHECK (true), el RLS predeterminado
-- requiere que la nueva fila también sea visible según la política SELECT (o una política ALL)
-- si no se define explícitamente para INSERT.

-- Asegurémonos de limpiar cualquier política previa conflictiva
DROP POLICY IF EXISTS "Anyone can create household" ON households;
DROP POLICY IF EXISTS "Users can view their household" ON households;

-- 1. Política explícita para INSERT
CREATE POLICY "Anyone can insert household"
ON households FOR INSERT
WITH CHECK (true);

-- 2. Política para SELECT que incluya explícitamente las filas recién creadas por el usuario en la misma transacción?
-- No, RLS en Postgres funciona fila a fila.
-- El problema suele ser que al hacer .insert().select(), el SELECT falla si la fila insertada no es visible.

-- Para que la fila sea visible en el SELECT posterior al INSERT:
-- La política de SELECT debe permitir ver el household_id que acabamos de crear.
-- Pero nuestra política SELECT usa `get_my_household_id()`, que busca en `users`.
-- Y todavía NO hemos creado el usuario en `users` (porque primero creamos el hogar).

-- ¡Ese es el problema!
-- Paso 1: Insertar Household -> OK (con política INSERT true)
-- Paso 2: Select Household (retorno de insert) -> FALLA RLS (porque no soy usuario aún, get_my_household_id retorna null)

-- SOLUCIÓN:
-- Modificar la política SELECT de households para permitir ver un hogar si acaba de ser creado (difícil de saber)
-- O usar `service_role` en el backend para la creación inicial.

-- Como estamos usando el cliente anon con RLS, necesitamos una política que permita al creador ver su hogar temporalmente
-- o relajar la política SELECT para que sea menos restrictiva si no hay riesgo de seguridad masivo.
-- Pero households tiene info privada.

-- MEJOR SOLUCIÓN ARQUITECTÓNICA:
-- Usar una función RPC `create_household_and_user` que se ejecute con `SECURITY DEFINER`.
-- Esto evita tener que dar permisos RLS complejos para el proceso de bootstrapping.

CREATE OR REPLACE FUNCTION create_household_and_admin(
  household_name TEXT,
  telegram_id TEXT,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de admin/creador de la función
AS $$
DECLARE
  new_household_id UUID;
  new_household_data JSONB;
BEGIN
  -- 1. Insertar Hogar
  INSERT INTO households (name, timezone)
  VALUES (household_name, 'America/Santiago')
  RETURNING id INTO new_household_id;

  -- 2. Insertar Usuario Admin
  INSERT INTO users (household_id, telegram_id, telegram_username, first_name, last_name, role)
  VALUES (new_household_id, telegram_id, telegram_username, first_name, last_name, 'admin');

  -- 3. Retornar datos del hogar para el cliente
  SELECT to_jsonb(h) INTO new_household_data
  FROM households h
  WHERE h.id = new_household_id;

  RETURN new_household_data;
END;
$$;

-- Dar permisos de ejecución a anon/authenticated
GRANT EXECUTE ON FUNCTION create_household_and_admin TO anon;
GRANT EXECUTE ON FUNCTION create_household_and_admin TO authenticated;
GRANT EXECUTE ON FUNCTION create_household_and_admin TO service_role;
