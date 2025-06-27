-- Permitir que o usuário autenticado exclua convites enviados por ele
-- (Ajuste para Supabase/PostgreSQL)

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow sender to delete own invitations"
ON invitations
FOR DELETE
USING (auth.uid() = sender_id);
