-- 1. Crear tabla 'user_balances'
CREATE TABLE user_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Constraint UNIQUE (household_id, user_id)
CREATE UNIQUE INDEX idx_user_balances_unique ON user_balances(household_id, user_id);

-- 3. Índices
CREATE INDEX idx_balances_household ON user_balances(household_id);
CREATE INDEX idx_balances_user ON user_balances(user_id);

-- 4. Trigger para updated_at
CREATE TRIGGER update_user_balances_updated_at
    BEFORE UPDATE ON user_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Comentarios: "Balance positivo = otros deben al usuario, negativo = usuario debe"
COMMENT ON COLUMN user_balances.balance IS 'Balance financiero del usuario en el hogar. Positivo: le deben dinero. Negativo: debe dinero.';
