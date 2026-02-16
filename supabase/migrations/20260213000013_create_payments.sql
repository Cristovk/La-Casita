-- 1. Crear tabla 'payments'
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 2. Índices
CREATE INDEX idx_payments_debt ON payments(debt_id);
CREATE INDEX idx_payments_date ON payments(paid_at DESC);

-- 3. Comentarios explicando pagos parciales vs. completos
COMMENT ON TABLE payments IS 'Pagos realizados para saldar deudas (parcial o totalmente)';
