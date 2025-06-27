/*
  # Fix ambiguous column reference in send_couple_invitation function

  1. Changes
    - Rename function parameter from `recipient_email` to `_recipient_email` to avoid ambiguity
    - Update all references within the function body
*/

-- Drop and recreate the function with fixed parameter name
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

  -- Check if invitation already exists
  IF EXISTS (
    SELECT 1 FROM invitations 
    WHERE sender_id = auth.uid() 
    AND recipient_email = _recipient_email 
    AND status = 'pending'
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Invitation already sent to this email';
  END IF;

  -- Create invitation
  INSERT INTO invitations (sender_id, recipient_email)
  VALUES (auth.uid(), _recipient_email)
  RETURNING id INTO invitation_id;

  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;