-- Permitir reenvio de convite: se já existir convite pendente, atualiza o expires_at e retorna o id, senão cria novo
DROP FUNCTION IF EXISTS send_couple_invitation(text);

CREATE OR REPLACE FUNCTION send_couple_invitation(_recipient_email text)
RETURNS uuid AS $$
DECLARE
  invitation_id uuid;
  sender_profile profiles%ROWTYPE;
BEGIN
  -- Get sender profile
  SELECT * INTO sender_profile FROM profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Check if already in a couple
  IF EXISTS (
    SELECT 1 FROM couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is already in a couple relationship';
  END IF;

  -- Se já existe convite pendente, atualiza o expires_at e retorna o id
  SELECT id INTO invitation_id FROM invitations 
    WHERE sender_id = auth.uid() 
    AND recipient_email = _recipient_email 
    AND status = 'pending';
  IF FOUND THEN
    UPDATE invitations SET expires_at = now() + interval '3 days' WHERE id = invitation_id;
    RETURN invitation_id;
  END IF;

  -- Cria novo convite
  INSERT INTO invitations (sender_id, recipient_email)
  VALUES (auth.uid(), _recipient_email)
  RETURNING id INTO invitation_id;

  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aceitar convite: atribui plano premium ao convidado se o remetente for premium
DROP FUNCTION IF EXISTS accept_couple_invitation(uuid);

CREATE OR REPLACE FUNCTION accept_couple_invitation(invitation_id uuid)
RETURNS uuid AS $$
DECLARE
  invitation_record invitations%ROWTYPE;
  sender_profile profiles%ROWTYPE;
  couple_id uuid;
BEGIN
  -- Get invitation
  SELECT * INTO invitation_record FROM invitations WHERE id = invitation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;
  IF invitation_record.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending';
  END IF;
  IF invitation_record.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;
  -- Check if user is already in a couple
  IF EXISTS (
    SELECT 1 FROM couples 
    WHERE user1_id = auth.uid() OR user2_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is already in a couple relationship';
  END IF;
  -- Get sender profile
  SELECT * INTO sender_profile FROM profiles WHERE id = invitation_record.sender_id;
  -- Cria relacionamento
  INSERT INTO couples (user1_id, user2_id)
  VALUES (invitation_record.sender_id, auth.uid())
  RETURNING id INTO couple_id;
  -- Atualiza convite
  UPDATE invitations 
  SET status = 'accepted', recipient_id = auth.uid()
  WHERE id = invitation_id;
  -- Se remetente for premium, torna o convidado premium também
  IF sender_profile.plan_type = 'premium' THEN
    UPDATE profiles SET plan_type = 'premium', subscription_status = 'active' WHERE id = auth.uid();
  END IF;
  RETURN couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
