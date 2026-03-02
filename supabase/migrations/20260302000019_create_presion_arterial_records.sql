-- Crear tabla especializada para registros de presión arterial
-- Este enfoque permite almacenamiento tipado en lugar de JSONB genérico
CREATE TABLE presion_arterial_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Datos de presión
  sistolica INTEGER NOT NULL,
  diastolica INTEGER NOT NULL,
  pulso INTEGER,
  en_ayunas BOOLEAN,
  brazo TEXT,
  
  -- Metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints para validación en BD
  CONSTRAINT presion_sistolica_range CHECK (sistolica >= 60 AND sistolica <= 300),
  CONSTRAINT presion_diastolica_range CHECK (diastolica >= 30 AND diastolica <= 200),
  CONSTRAINT presion_pulso_range CHECK (pulso IS NULL OR (pulso >= 30 AND pulso <= 250)),
  CONSTRAINT presion_brazo_valid CHECK (brazo IS NULL OR brazo IN ('izquierdo', 'derecho'))
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX idx_presion_household ON presion_arterial_records(household_id);
CREATE INDEX idx_presion_user ON presion_arterial_records(user_id);
CREATE INDEX idx_presion_recorded_at ON presion_arterial_records(recorded_at DESC);
CREATE INDEX idx_presion_household_recorded ON presion_arterial_records(household_id, recorded_at DESC);
CREATE INDEX idx_presion_user_recorded ON presion_arterial_records(user_id, recorded_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_presion_arterial_records_updated_at
    BEFORE UPDATE ON presion_arterial_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentario explicativo
COMMENT ON TABLE presion_arterial_records IS 'Registros de presión arterial con columnas tipadas para almacenamiento normalizado';
COMMENT ON COLUMN presion_arterial_records.sistolica IS 'Presión sistólica en mmHg (rango: 60-300)';
COMMENT ON COLUMN presion_arterial_records.diastolica IS 'Presión diastólica en mmHg (rango: 30-200)';
COMMENT ON COLUMN presion_arterial_records.pulso IS 'Frecuencia cardíaca en bpm (rango: 30-250, opcional)';
COMMENT ON COLUMN presion_arterial_records.brazo IS 'Brazo de medición: "izquierdo" o "derecho" (opcional)';
COMMENT ON COLUMN presion_arterial_records.en_ayunas IS 'Indica si se midió en ayunas (opcional)';
