-- Habilitar RLS en presion_arterial_records
ALTER TABLE presion_arterial_records ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios pueden ver registros de su hogar
CREATE POLICY "Users can view household presion records"
ON presion_arterial_records FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

-- Política para INSERT: usuarios pueden insertar registros en su hogar
CREATE POLICY "Users can insert presion records to their household"
ON presion_arterial_records FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

-- Política para UPDATE: usuarios pueden actualizar sus propios registros
CREATE POLICY "Users can update own presion records"
ON presion_arterial_records FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);

-- Política para DELETE: usuarios pueden eliminar sus propios registros
CREATE POLICY "Users can delete own presion records"
ON presion_arterial_records FOR DELETE
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE telegram_id = current_setting('app.telegram_id', true)::text
  )
);
