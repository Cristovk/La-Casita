-- 1. Crear tabla 'household_invites'
CREATE TABLE household_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX idx_invites_code ON household_invites(invite_code);
CREATE INDEX idx_invites_household ON household_invites(household_id);

-- 3. Comentarios explicando el flujo de invitación
COMMENT ON TABLE household_invites IS 'Códigos de invitación para unirse a un hogar. Válidos por tiempo limitado y de uso único.';
