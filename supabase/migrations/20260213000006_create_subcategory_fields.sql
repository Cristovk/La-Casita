-- 1. Crear tabla 'subcategory_fields'
CREATE TABLE subcategory_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('number', 'text', 'date', 'datetime', 'select', 'boolean')),
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB, -- {min, max, regex, options}
  unit TEXT, -- ej: 'mmHg', 'mg/dL', 'kg'
  default_value TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX idx_fields_subcategory ON subcategory_fields(subcategory_id);
CREATE INDEX idx_fields_order ON subcategory_fields(subcategory_id, display_order);

-- 3. Comentarios explicando cada field_type y estructura de validation_rules
COMMENT ON COLUMN subcategory_fields.field_type IS 'Tipos de campo soportados: number, text, date, datetime, select, boolean';
COMMENT ON COLUMN subcategory_fields.validation_rules IS 'Reglas de validación en JSON: {"min": 60, "max": 250, "regex": "^[0-9]+$", "options": ["opcion1", "opcion2"]}';
