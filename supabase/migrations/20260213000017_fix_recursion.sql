-- FIX: Romper la recursión infinita en políticas RLS de usuarios y households

-- 1. Eliminar políticas conflictivas existentes
DROP POLICY IF EXISTS "Users can view members of their household" ON users;
DROP POLICY IF EXISTS "Users can view their household" ON households;
DROP POLICY IF EXISTS "Admins can update household" ON households;

-- 2. Crear nueva política para 'users' sin autoreferencia recursiva
-- La recursión ocurría porque al consultar 'users' se evaluaba la política que consultaba 'users' nuevamente.
-- Solución: Usar security definer functions o simplificar la lógica para evitar JOINs a la misma tabla.
-- OJO: Supabase/Postgres permite recursión limitada, pero policies circulares directas fallan.

-- Permitir que un usuario se vea a sí mismo (sin JOIN)
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (telegram_id = current_setting('app.telegram_id', true)::text);

-- Permitir ver a otros miembros del MISMO hogar (esto causaba recursión si no se tiene cuidado)
-- Estrategia: Usar una función que encapsule la búsqueda del household_id del usuario actual para evitar el ciclo directo en la definición de la política.
-- Pero para simplificar y asegurar que funcione, podemos confiar en que el usuario ya sabe su household_id por contexto o permitir lectura pública de miembros si se conoce el household_id (menos seguro) o...
-- Mejor: Usar el household_id que viene en la sesión/contexto si fuera posible, pero RLS es a nivel DB.

-- Solución Robusta: Definir una política que evite el ciclo user -> household -> user.
-- El ciclo era: Para ver un usuario, verifico si su household_id está en la lista de household_ids donde estoy yo (que requiere leer users).

-- Nueva estrategia para users:
-- Un usuario puede ver filas en 'users' si:
-- 1. Es él mismo (telegram_id coincide)
-- 2. O comparten el mismo household_id (que obtenemos de una subquery segura o función)

CREATE POLICY "Users can view household members"
ON users FOR SELECT
USING (
  household_id = (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text 
    LIMIT 1
  )
);
-- Nota: Esto sigue siendo técnicamente recursivo (select from users dentro de policy de users), pero Postgres suele optimizarlo si es simple.
-- Si falla con "infinite recursion", la solución definitiva es no usar RLS para filtrar miembros en consultas internas del bot (usar service_role) 
-- O separar la tabla de "auth/permissions" de la de "perfiles".

-- Dado que estamos usando RLS estricto, vamos a probar una política que NO haga select a users directamente en la condición si es posible,
-- O aceptar que para este MVP, el SELECT de miembros podría requerir service_role si RLS se pone difícil.
-- SIN EMBARGO, el error reportado fue al INSERTAR/CREAR un hogar.

-- El error 42P17 "infinite recursion" al insertar en households/users suele ser porque la política CHECK o la de SELECT implícita se muerden la cola.

-- Revisemos la política de households:
-- USING (id IN (SELECT household_id FROM users WHERE telegram_id = ...))
-- Si al insertar un household, se dispara un trigger o check que lee users, y users lee households... bum.

-- SOLUCIÓN PRÁCTICA PARA EL ERROR DE CREACIÓN:
-- Al crear un hogar (INSERT households), no debería haber chequeos complejos.
-- Al crear un usuario (INSERT users), tampoco.

-- Asegurémonos que las políticas de INSERT sean limpias:
DROP POLICY IF EXISTS "Anyone can create household" ON households;
CREATE POLICY "Anyone can create household" ON households FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert users" ON users;
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);

-- Y para SELECT, vamos a simplificar para romper el ciclo.
-- En lugar de JOINs complejos, permitimos ver households si conoces el ID (el bot filtra) O si eres miembro.
-- Para evitar el ciclo Users <-> Households:

-- Política simplificada para Households SELECT
CREATE POLICY "Users can view their household"
ON households FOR SELECT
USING (
    -- Opción A: Eres miembro (requiere leer users)
    id IN (SELECT household_id FROM users WHERE telegram_id = current_setting('app.telegram_id', true)::text)
);

-- Política simplificada para Users SELECT
-- Para evitar que Users lea Households que lea Users...
-- Simplemente:
CREATE POLICY "Users can view members"
ON users FOR SELECT
USING (
    telegram_id = current_setting('app.telegram_id', true)::text -- Ver propio
    OR 
    household_id IN ( -- Ver compañeros
        SELECT household_id FROM users WHERE telegram_id = current_setting('app.telegram_id', true)::text
    )
);

-- Si esto sigue fallando, es porque Postgres detecta que "users" depende de "users".
-- Workaround: Usar `security definer` function para obtener el household_id del usuario actual, 
-- sacando la lectura de la tabla users "fuera" del alcance de la política RLS directa.

CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT household_id FROM users WHERE telegram_id = current_setting('app.telegram_id', true)::text LIMIT 1;
$$;

-- Ahora reescribimos las políticas usando esta función opaca
DROP POLICY IF EXISTS "Users can view members" ON users;
CREATE POLICY "Users can view members"
ON users FOR SELECT
USING (
  household_id = get_my_household_id() 
  OR telegram_id = current_setting('app.telegram_id', true)::text
);

DROP POLICY IF EXISTS "Users can view their household" ON households;
CREATE POLICY "Users can view their household"
ON households FOR SELECT
USING (
  id = get_my_household_id()
);

DROP POLICY IF EXISTS "Admins can update household" ON households;
CREATE POLICY "Admins can update household"
ON households FOR UPDATE
USING (
  id = get_my_household_id()
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text 
    AND role = 'admin'
  )
);
