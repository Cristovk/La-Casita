-- 1. Crear tabla 'users'
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  telegram_id TEXT UNIQUE NOT NULL,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_household ON users(household_id);

-- 3. Trigger para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Comentarios explicando que telegram_id es la clave de autenticación
COMMENT ON COLUMN users.telegram_id IS 'Identificador único de Telegram usado para autenticación RLS';
