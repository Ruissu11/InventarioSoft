-- ────────────────────────────────────────────────────────────────────────────
-- 002_add_auth_fields_to_users.sql
--
-- La tabla users quedó sin password_hash en el schema inicial.
-- La tabla está vacía en dev, así que ALTER TABLE es seguro.
--
-- password_hash  → almacena el hash bcrypt. Nunca el password en texto plano.
-- updated_at     → auditoría: cuándo se modificó el registro.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN password_hash TEXT    NOT NULL DEFAULT '',
  ADD COLUMN updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Eliminamos el DEFAULT de password_hash.
-- Forzamos que siempre se pase un hash explícito en el INSERT.
-- Si alguien intenta INSERT sin password_hash → error de BD. Intencional.
ALTER TABLE users ALTER COLUMN password_hash DROP DEFAULT;