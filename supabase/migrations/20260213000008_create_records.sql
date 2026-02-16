-- 1. Crear tabla 'records'
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- datos validados dinámicamente
  recorded_at TIMESTAMPTZ DEFAULT NOW(), -- fecha/hora del evento
  notes TEXT, -- notas adicionales del usuario
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para optimizar consultas
CREATE INDEX idx_records_household ON records(household_id);
CREATE INDEX idx_records_user ON records(user_id);
CREATE INDEX idx_records_subcategory ON records(subcategory_id);
CREATE INDEX idx_records_date ON records(recorded_at DESC);
CREATE INDEX idx_records_data ON records USING GIN (data); -- para búsquedas en JSONB

-- 3. Trigger para updated_at
CREATE TRIGGER update_records_updated_at
    BEFORE UPDATE ON records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Comentarios explicando que 'data' se valida en la aplicación con esquemas dinámicos
COMMENT ON COLUMN records.data IS 'Datos del registro en formato JSONB, validados por la aplicación según el esquema de la subcategoría';
