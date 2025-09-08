/*
  # Melhorias no fluxo de convites e funcionalidade de casais

  1. Função melhorada para envio de convites
    - Verifica se usuário já existe antes de criar
    - Evita duplicação de usuários
    - Melhora tratamento de erros

  2. Função para limpeza de usuários órfãos
    - Remove usuários que não têm convites aceitos
    - Mantém integridade do banco

  3. Melhorias na função de aceitar convites
    - Melhor tratamento de relacionamentos
    - Sincronização de planos premium
*/

-- Função melhorada para envio de convites
CREATE OR REPLACE FUNCTION send_couple_invitation_improved(_recipient_email text)
RETURNS jsonb AS $$
DECLARE
  invitation_id uuid;
  sender_profile profiles%ROWTYPE;
  existing_user_id uuid;
  existing_invitation_id uuid;
  result jsonb;
BEGIN
  -- Get sender profile
  SELECT * INTO sender_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Check if already in a couple
  IF EXISTS (
    SELECT 1 FROM couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already in a couple relationship');
  END IF;

  -- Check if there's already a pending invitation
  SELECT id INTO existing_invitation_id FROM invitations 
  WHERE sender_id = auth.uid() 
    AND recipient_email = _recipient_email 
    AND status = 'pending'
    AND expires_at > now();

  IF FOUND THEN
    -- Update expiration date of existing invitation
    UPDATE invitations 
    SET expires_at = now() + interval '7 days', updated_at = now()
    WHERE id = existing_invitation_id;
    
    RETURN jsonb_build_object(
      'success', true, 
      'invitation_id', existing_invitation_id,
      'message', 'Invitation renewed'
    );
  END IF;

  -- Check if user already exists in auth
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = _recipient_email;

  IF NOT FOUND THEN
    -- Create new user in auth without sending email
    BEGIN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        _recipient_email,
        crypt('temp_password_' || gen_random_uuid()::text, gen_salt('bf')),
        NULL, -- Email not confirmed yet
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        now(),
        now(),
        encode(gen_random_bytes(32), 'base64'),
        '',
        '',
        ''
      ) RETURNING id INTO existing_user_id;
    EXCEPTION
      WHEN unique_violation THEN
        -- User already exists, get the ID
        SELECT id INTO existing_user_id FROM auth.users WHERE email = _recipient_email;
    END;
  END IF;

  -- Create or update profile
  INSERT INTO profiles (
    id, 
    email, 
    plan_type, 
    subscription_status,
    subscription_expires_at,
    invited_by,
    created_at,
    updated_at
  ) VALUES (
    existing_user_id,
    _recipient_email,
    CASE WHEN sender_profile.plan_type = 'premium' THEN 'premium' ELSE 'free' END,
    CASE WHEN sender_profile.plan_type = 'premium' THEN 'active' ELSE 'inactive' END,
    CASE WHEN sender_profile.plan_type = 'premium' THEN sender_profile.subscription_expires_at ELSE NULL END,
    auth.uid(),
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    plan_type = CASE WHEN sender_profile.plan_type = 'premium' THEN 'premium' ELSE profiles.plan_type END,
    subscription_status = CASE WHEN sender_profile.plan_type = 'premium' THEN 'active' ELSE profiles.subscription_status END,
    subscription_expires_at = CASE WHEN sender_profile.plan_type = 'premium' THEN sender_profile.subscription_expires_at ELSE profiles.subscription_expires_at END,
    invited_by = auth.uid(),
    updated_at = now();

  -- Create default categories for new user if they don't exist
  INSERT INTO categories (user_id, name, color, icon) 
  SELECT existing_user_id, name, color, icon FROM (
    VALUES 
      ('Alimentação', '#ef4444', 'UtensilsCrossed'),
      ('Transporte', '#3b82f6', 'Car'),
      ('Saúde', '#10b981', 'Heart'),
      ('Entretenimento', '#f59e0b', 'Gamepad2'),
      ('Casa', '#8b5cf6', 'Home'),
      ('Educação', '#06b6d4', 'GraduationCap'),
      ('Outros', '#6b7280', 'MoreHorizontal')
  ) AS default_categories(name, color, icon)
  WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE user_id = existing_user_id
  );

  -- Create invitation
  INSERT INTO invitations (sender_id, recipient_email, recipient_id, expires_at)
  VALUES (auth.uid(), _recipient_email, existing_user_id, now() + interval '7 days')
  RETURNING id INTO invitation_id;

  RETURN jsonb_build_object(
    'success', true, 
    'invitation_id', invitation_id,
    'user_created', existing_user_id,
    'message', 'Invitation sent successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpeza de usuários órfãos quando convite é cancelado
CREATE OR REPLACE FUNCTION cleanup_orphaned_user(_user_email text)
RETURNS boolean AS $$
DECLARE
  user_to_delete_id uuid;
  has_accepted_invitations boolean;
  has_expenses boolean;
BEGIN
  -- Get user ID
  SELECT id INTO user_to_delete_id FROM auth.users WHERE email = _user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if user has accepted invitations or is in a couple
  SELECT EXISTS(
    SELECT 1 FROM invitations 
    WHERE recipient_id = user_to_delete_id AND status = 'accepted'
  ) OR EXISTS(
    SELECT 1 FROM couples 
    WHERE user1_id = user_to_delete_id OR user2_id = user_to_delete_id
  ) INTO has_accepted_invitations;

  -- Check if user has expenses
  SELECT EXISTS(
    SELECT 1 FROM expenses WHERE user_id = user_to_delete_id
  ) INTO has_expenses;

  -- Only delete if user has no accepted invitations and no expenses
  IF NOT has_accepted_invitations AND NOT has_expenses THEN
    -- Delete from profiles first (cascade will handle related data)
    DELETE FROM profiles WHERE id = user_to_delete_id;
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = user_to_delete_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função melhorada para aceitar convites
CREATE OR REPLACE FUNCTION accept_couple_invitation_improved(invitation_id uuid)
RETURNS jsonb AS $$
DECLARE
  invitation_record invitations%ROWTYPE;
  sender_profile profiles%ROWTYPE;
  couple_id uuid;
BEGIN
  -- Get invitation
  SELECT * INTO invitation_record FROM invitations WHERE id = invitation_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  IF invitation_record.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation is not pending');
  END IF;

  IF invitation_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  -- Check if user is already in a couple
  IF EXISTS (
    SELECT 1 FROM couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already in a couple relationship');
  END IF;

  -- Get sender profile
  SELECT * INTO sender_profile FROM profiles WHERE id = invitation_record.sender_id;

  -- Create couple relationship
  INSERT INTO couples (user1_id, user2_id)
  VALUES (invitation_record.sender_id, auth.uid())
  RETURNING id INTO couple_id;

  -- Update invitation status
  UPDATE invitations 
  SET status = 'accepted', recipient_id = auth.uid(), accepted_at = now()
  WHERE id = invitation_id;

  -- Sync premium status if sender is premium
  IF sender_profile.plan_type = 'premium' THEN
    UPDATE profiles 
    SET 
      plan_type = 'premium', 
      subscription_status = 'active',
      subscription_expires_at = sender_profile.subscription_expires_at
    WHERE id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'couple_id', couple_id,
    'message', 'Invitation accepted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para completar registro de usuário convidado
CREATE OR REPLACE FUNCTION complete_user_registration_improved(
  user_email text, 
  user_password text, 
  full_name text
)
RETURNS jsonb AS $$
DECLARE
  user_id uuid;
  invitation_record invitations%ROWTYPE;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Update user password and confirm email
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(user_password, gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = user_id;

  -- Update profile with full name
  UPDATE profiles 
  SET 
    full_name = complete_user_registration_improved.full_name,
    updated_at = now()
  WHERE id = user_id;

  -- Check if there's a pending invitation for this user
  SELECT * INTO invitation_record 
  FROM invitations 
  WHERE recipient_email = user_email AND status = 'pending'
  ORDER BY created_at DESC 
  LIMIT 1;

  IF FOUND THEN
    -- Auto-accept the invitation and create couple relationship
    PERFORM accept_couple_invitation_improved(invitation_record.id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User registration completed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;