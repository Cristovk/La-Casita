-- 1. Crear función PostgreSQL
CREATE OR REPLACE FUNCTION set_telegram_id(telegram_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.telegram_id', telegram_id, false);
END;
$$;

-- 2. Comentarios explicando
COMMENT ON FUNCTION set_telegram_id IS 'Establece el contexto app.telegram_id para las políticas RLS. Debe llamarse al inicio de cada request.';

-- 3. Grant EXECUTE a anon (rol público)
GRANT EXECUTE ON FUNCTION set_telegram_id TO anon;
GRANT EXECUTE ON FUNCTION set_telegram_id TO authenticated;
GRANT EXECUTE ON FUNCTION set_telegram_id TO service_role;
