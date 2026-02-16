-- 1. Crear tabla 'subcategories'
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  ownership_type TEXT DEFAULT 'personal' CHECK (ownership_type IN ('personal', 'shared', 'both')),
  data_schema JSONB, -- esquema legacy para compatibilidad
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_subcategories_slug ON subcategories(slug);

-- 3. Comentarios explicando ownership_type
COMMENT ON COLUMN subcategories.ownership_type IS 'personal: solo creador ve/edita; shared: todos ven/editan; both: permite ambos modos';
