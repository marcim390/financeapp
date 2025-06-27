-- Adiciona a coluna accepted_at para registrar quando o convite foi aceito
ALTER TABLE invitations ADD COLUMN accepted_at timestamptz;
-- Opcional: index para buscas rápidas
CREATE INDEX IF NOT EXISTS invitations_accepted_at_idx ON invitations(accepted_at);
