-- 1. Crear tabla 'sessions'
CREATE TABLE sessions (
  key TEXT PRIMARY KEY, -- formato: "chat_id:user_id" de Telegraf
  session JSONB NOT NULL, -- datos completos de la sesión
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX idx_sessions_expires ON sessions(expires_at); -- para limpieza automática

-- 3. Trigger para updated_at
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Comentarios explicando TTL de 24 horas y limpieza periódica
COMMENT ON TABLE sessions IS 'Almacenamiento persistente de sesiones de Telegraf para sobrevivir reinicios';
