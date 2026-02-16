-- 1. Crear tabla 'expense_splits'
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL, -- monto que debe pagar
  paid_amount DECIMAL(10,2) DEFAULT 0, -- monto ya pagado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX idx_expense_splits_record ON expense_splits(record_id);
CREATE INDEX idx_expense_splits_user ON expense_splits(user_id);

-- 3. Check constraint: paid_amount <= amount
ALTER TABLE expense_splits ADD CONSTRAINT check_paid_amount CHECK (paid_amount <= amount);

-- 4. Comentarios explicando el flujo de gastos compartidos
COMMENT ON TABLE expense_splits IS 'Detalle de cómo se divide un gasto entre los miembros del hogar';
