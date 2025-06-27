-- Policy para permitir que usuários criem vínculo de casal (INSERT na tabela couples)
CREATE POLICY "Users can create couple relationship"
  ON couples
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- (Opcional, mas recomendado) Garante que o RLS está ativado
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
