-- Atualiza a função handle_new_user para criar profile completo e categorias padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  INSERT INTO profiles (id, email, full_name, plan_type, subscription_status)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    'free',
    'inactive'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Cria categorias padrão para o novo usuário
  INSERT INTO categories (user_id, name, color, icon) VALUES
    (NEW.id, 'Alimentação', '#ef4444', 'UtensilsCrossed'),
    (NEW.id, 'Transporte', '#3b82f6', 'Car'),
    (NEW.id, 'Saúde', '#10b981', 'Heart'),
    (NEW.id, 'Entretenimento', '#f59e0b', 'Gamepad2'),
    (NEW.id, 'Casa', '#8b5cf6', 'Home'),
    (NEW.id, 'Educação', '#06b6d4', 'GraduationCap'),
    (NEW.id, 'Outros', '#6b7280', 'MoreHorizontal');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
