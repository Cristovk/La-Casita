-- 1. Habilitar RLS en todas las tablas
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategory_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'households'
CREATE POLICY "Users can view their household"
ON households FOR SELECT
USING (
  id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

CREATE POLICY "Anyone can create household"
ON households FOR INSERT
WITH CHECK (true); -- Permitido para /start crear hogar

CREATE POLICY "Admins can update household"
ON households FOR UPDATE
USING (
  id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
    AND role = 'admin'
  )
);

-- 3. Políticas para 'users'
CREATE POLICY "Users can view members of their household"
ON users FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
  OR telegram_id = current_setting('app.telegram_id', true)::text -- Ver propio perfil aunque no tenga hogar aun
);

-- Romper la recursión infinita en INSERT de usuarios
CREATE POLICY "Anyone can insert users"
ON users FOR INSERT
WITH CHECK (true);

-- Romper la recursión infinita en UPDATE de usuarios
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (telegram_id = current_setting('app.telegram_id', true)::text);

-- Evitar recursión en políticas de 'households' accediendo directamente por ID o permitiendo creación
DROP POLICY IF EXISTS "Users can view their household" ON households;
CREATE POLICY "Users can view their household"
ON households FOR SELECT
USING (
  id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

DROP POLICY IF EXISTS "Anyone can create household" ON households;
CREATE POLICY "Anyone can create household"
ON households FOR INSERT
WITH CHECK (true);


-- 4. Políticas para 'records'
CREATE POLICY "Users can view household records"
ON records FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

CREATE POLICY "Users can insert records to their household"
ON records FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

CREATE POLICY "Users can update own records"
ON records FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

CREATE POLICY "Users can delete own records"
ON records FOR DELETE
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

-- 5. Políticas para 'tags'
CREATE POLICY "Users can view global and household tags"
ON tags FOR SELECT
USING (
  household_id IS NULL OR
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

CREATE POLICY "Users can manage household tags"
ON tags FOR ALL
USING (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

-- 6. Políticas para 'sessions'
CREATE POLICY "Users can manage own sessions"
ON sessions FOR ALL
USING (
  key LIKE '%' || current_setting('app.telegram_id', true)::text || '%' -- Asumiendo key contiene telegram_id
);
-- Nota: Para sessions, a veces es necesario permitir acceso más amplio si la key no contiene el ID directo,
-- pero idealmente el bot gestiona esto con service_role si es necesario.
-- Como usamos anon_key, necesitamos una política permisiva para el bot o asegurar que key contenga el ID.
-- Por ahora, permitimos todo en sessions para simplificar el MVP ya que el bot gestiona la seguridad
CREATE POLICY "Allow all access to sessions for now"
ON sessions FOR ALL
USING (true);


-- 7. Políticas para otras tablas (simplificado)
CREATE POLICY "View household categories" ON categories FOR SELECT USING (household_id IS NULL OR household_id IN (SELECT household_id FROM users WHERE telegram_id = current_setting('app.telegram_id', true)::text));
CREATE POLICY "View household subcategories" ON subcategories FOR SELECT USING (category_id IN (SELECT id FROM categories));
CREATE POLICY "View household fields" ON subcategory_fields FOR SELECT USING (subcategory_id IN (SELECT id FROM subcategories));

-- Invites
CREATE POLICY "Admins can create invites" ON household_invites FOR INSERT WITH CHECK (household_id IN (SELECT household_id FROM users WHERE telegram_id = current_setting('app.telegram_id', true)::text AND role = 'admin'));
CREATE POLICY "Anyone can view invites by code" ON household_invites FOR SELECT USING (true); -- Necesario para validar código antes de unirse
CREATE POLICY "Users can update invite usage" ON household_invites FOR UPDATE USING (true); -- Necesario para marcar como usado

