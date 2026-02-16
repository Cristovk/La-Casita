-- 1. Crear tabla 'tags'
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- código hex o nombre de color
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice único compuesto para evitar duplicados
CREATE UNIQUE INDEX idx_tags_household_name_unique ON tags(COALESCE(household_id::text, 'global'), name);

-- 3. Comentarios explicando tags globales (sugeridos) vs. personalizados
COMMENT ON COLUMN tags.household_id IS 'NULL para tags globales (sistema), UUID para tags personalizados de un hogar';
