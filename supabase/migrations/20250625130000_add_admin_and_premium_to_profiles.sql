-- Adiciona os campos is_admin e is_premium na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Opcional: defina o admin inicial (ajuste o id conforme necessário)
-- UPDATE profiles SET is_admin = true WHERE email = 'admin@seudominio.com';

-- Opcional: defina premium para usuários específicos
-- UPDATE profiles SET is_premium = true WHERE email = 'premium@seudominio.com';
