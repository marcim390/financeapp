-- Corrige policy de admin para evitar recursão infinita usando user_metadata do Auth
-- Ajuste o campo 'is_admin' conforme o nome real no seu user_metadata

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = id)
    OR
    ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
  );
