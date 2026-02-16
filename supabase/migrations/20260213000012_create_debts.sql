-- 1. Crear tabla 'debts'
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id), -- quien debe
  creditor_id UUID NOT NULL REFERENCES users(id), -- a quien se debe
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_settled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

-- 2. Check constraint: debtor_id != creditor_id
ALTER TABLE debts ADD CONSTRAINT check_debtor_creditor CHECK (debtor_id != creditor_id);

-- 3. Índices
CREATE INDEX idx_debts_household ON debts(household_id);
CREATE INDEX idx_debts_debtor ON debts(debtor_id);
CREATE INDEX idx_debts_creditor ON debts(creditor_id);
CREATE INDEX idx_debts_unsettled ON debts(household_id) WHERE is_settled = false;

-- 4. Comentarios explicando simplificación de deudas
COMMENT ON TABLE debts IS 'Registro de deudas directas entre usuarios, generadas por gastos compartidos';
