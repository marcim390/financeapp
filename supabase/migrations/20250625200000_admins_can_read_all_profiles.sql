-- Permite que administradores leiam todos os profiles no Supabase
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = id)
    OR
    (EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    ))
  );
