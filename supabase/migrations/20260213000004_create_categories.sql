-- 1. Crear tabla 'categories'
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice único compuesto
CREATE UNIQUE INDEX idx_categories_slug_unique ON categories(COALESCE(household_id::text, 'global'), slug);

-- 3. Comentarios explicando categorías globales vs. personalizadas
COMMENT ON COLUMN categories.household_id IS 'NULL para categorías globales (sistema), UUID para categorías personalizadas de un hogar';
