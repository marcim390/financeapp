-- Corrige lógica: se o remetente for premium, o convidado SEMPRE vira premium ao aceitar o convite
-- Data: 2025-06-25

DROP FUNCTION IF EXISTS accept_couple_invitation(uuid);

CREATE OR REPLACE FUNCTION accept_couple_invitation(invitation_id uuid)
RETURNS uuid AS $$
DECLARE
  invitation_record invitations%ROWTYPE;
  sender_profile profiles%ROWTYPE;
  recipient_profile profiles%ROWTYPE;
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
  -- Get sender and recipient profiles
  SELECT * INTO sender_profile FROM profiles WHERE id = invitation_record.sender_id;
  SELECT * INTO recipient_profile FROM profiles WHERE id = auth.uid();
  -- Cria relacionamento
  INSERT INTO couples (user1_id, user2_id)
  VALUES (invitation_record.sender_id, auth.uid())
  RETURNING id INTO couple_id;
  -- Atualiza convite
  UPDATE invitations 
  SET status = 'accepted', recipient_id = auth.uid()
  WHERE id = invitation_id;
  -- LOG: Antes de atualizar profiles
  RAISE NOTICE 'Antes do update: sender_profile.plan_type=%, recipient_profile.plan_type=%', sender_profile.plan_type, recipient_profile.plan_type;
  -- Se o remetente for premium, o convidado SEMPRE vira premium
  IF sender_profile.plan_type = 'premium' THEN
    UPDATE profiles SET plan_type = 'premium', subscription_status = 'active' WHERE id = recipient_profile.id;
    RAISE NOTICE 'Convidado atualizado para premium (remetente premium)';
  END IF;
  -- Se o convidado for premium, o remetente também vira premium
  IF recipient_profile.plan_type = 'premium' THEN
    UPDATE profiles SET plan_type = 'premium', subscription_status = 'active' WHERE id = sender_profile.id;
    RAISE NOTICE 'Remetente atualizado para premium (convidado premium)';
  END IF;
  -- LOG: Depois do update
  RAISE NOTICE 'Aceite concluído para convite %, casal criado: %', invitation_id, couple_id;
  RETURN couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
