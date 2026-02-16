-- 1. Crear tabla 'record_tags'
CREATE TABLE record_tags (
  record_id UUID NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, tag_id)
);

-- 2. Índices
CREATE INDEX idx_record_tags_record ON record_tags(record_id);
CREATE INDEX idx_record_tags_tag ON record_tags(tag_id);

-- 3. Comentarios explicando la relación muchos a muchos
COMMENT ON TABLE record_tags IS 'Relación muchos a muchos entre registros y etiquetas';
