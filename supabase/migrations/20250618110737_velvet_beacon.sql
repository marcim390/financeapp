/*
  # Enhanced User Profiles and Couples System

  1. New Tables
    - Enhanced `profiles` table with additional fields
    - `couples` table for partner relationships
    - `invitations` table for couple invitations
    - `user_categories` table for custom categories per user
    - Enhanced `expenses` table with couple support
    - `notifications` table for admin notifications
    - `subscription_logs` table for tracking subscription changes

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
    - Add admin-only policies for administrative functions

  3. Functions
    - Function to send couple invitations
    - Function to accept couple invitations
    - Function to check subscription limits
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text CHECK (gender IN ('male', 'female'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cakto_subscriber_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cakto_subscriber_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_transactions_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_transactions_used integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_transaction_reset'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_transaction_reset date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create couples table
CREATE TABLE IF NOT EXISTS couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_email text NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table for admin
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_users text DEFAULT 'all' CHECK (target_users IN ('all', 'free', 'premium')),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription logs table
CREATE TABLE IF NOT EXISTS subscription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  old_plan text,
  new_plan text,
  cakto_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add couple_id to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'couple_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN couple_id uuid REFERENCES couples(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for couples
CREATE POLICY "Users can read own couple relationships"
  ON couples
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete own couple relationships"
  ON couples
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create policies for invitations
CREATE POLICY "Users can read own invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create invitations"
  ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own invitations"
  ON invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Create policies for notifications
CREATE POLICY "Everyone can read active notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for subscription logs
CREATE POLICY "Users can read own subscription logs"
  ON subscription_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all subscription logs"
  ON subscription_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_couples_user1_id ON couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2_id ON couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_invitations_sender_id ON invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient_email ON invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient_id ON invitations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_users ON notifications(target_users);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_couple_id ON expenses(couple_id);

-- Create triggers for updated_at
CREATE TRIGGER update_couples_updated_at
  BEFORE UPDATE ON couples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to send couple invitation
CREATE OR REPLACE FUNCTION send_couple_invitation(recipient_email text)
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
    AND recipient_email = send_couple_invitation.recipient_email 
    AND status = 'pending'
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Invitation already sent to this email';
  END IF;

  -- Create invitation
  INSERT INTO invitations (sender_id, recipient_email)
  VALUES (auth.uid(), recipient_email)
  RETURNING id INTO invitation_id;

  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept couple invitation
CREATE OR REPLACE FUNCTION accept_couple_invitation(invitation_id uuid)
RETURNS uuid AS $$
DECLARE
  invitation_record invitations%ROWTYPE;
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

  -- Create couple relationship
  INSERT INTO couples (user1_id, user2_id)
  VALUES (invitation_record.sender_id, auth.uid())
  RETURNING id INTO couple_id;

  -- Update invitation status
  UPDATE invitations 
  SET status = 'accepted', recipient_id = auth.uid()
  WHERE id = invitation_id;

  RETURN couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check transaction limits
CREATE OR REPLACE FUNCTION check_transaction_limit()
RETURNS boolean AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_month date;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- If premium user, no limits
  IF user_profile.plan_type = 'premium' THEN
    RETURN true;
  END IF;

  current_month := date_trunc('month', CURRENT_DATE)::date;

  -- Reset counter if new month
  IF user_profile.last_transaction_reset < current_month THEN
    UPDATE profiles 
    SET monthly_transactions_used = 0, last_transaction_reset = current_month
    WHERE id = auth.uid();
    RETURN true;
  END IF;

  -- Check if under limit (5 transactions for free users)
  RETURN user_profile.monthly_transactions_used < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment transaction count
CREATE OR REPLACE FUNCTION increment_transaction_count()
RETURNS void AS $$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  
  IF FOUND AND user_profile.plan_type = 'free' THEN
    UPDATE profiles 
    SET monthly_transactions_used = monthly_transactions_used + 1
    WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set admin flag for the specified email
UPDATE profiles 
SET is_admin = true 
WHERE email = 'marciojunior1993@gmail.com';