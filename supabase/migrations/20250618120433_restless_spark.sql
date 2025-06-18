-- Reset Database Script
-- This script will clean all data and recreate tables

-- First, disable RLS temporarily to allow cleanup
SET session_replication_role = replica;

-- Drop all existing data
TRUNCATE TABLE IF EXISTS subscription_logs CASCADE;
TRUNCATE TABLE IF EXISTS notifications CASCADE;
TRUNCATE TABLE IF EXISTS invitations CASCADE;
TRUNCATE TABLE IF EXISTS couples CASCADE;
TRUNCATE TABLE IF EXISTS recurring_expenses CASCADE;
TRUNCATE TABLE IF EXISTS expenses CASCADE;
TRUNCATE TABLE IF EXISTS categories CASCADE;
TRUNCATE TABLE IF EXISTS profiles CASCADE;

-- Drop all tables to start fresh
DROP TABLE IF EXISTS subscription_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS couples CASCADE;
DROP TABLE IF EXISTS recurring_expenses CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS person_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS frequency_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_default_categories(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS send_couple_invitation(text) CASCADE;
DROP FUNCTION IF EXISTS accept_couple_invitation(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_transaction_limit() CASCADE;
DROP FUNCTION IF EXISTS increment_transaction_count() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- Now we'll recreate everything by running the migrations in order

-- Migration 1: Initial Schema Setup
-- Create custom types
CREATE TYPE plan_type AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE person_type AS ENUM ('person1', 'person2', 'shared');
CREATE TYPE transaction_type AS ENUM ('expense', 'income');
CREATE TYPE frequency_type AS ENUM ('monthly', 'weekly', 'yearly');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  plan_type plan_type DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'inactive',
  subscription_expires_at timestamptz,
  hotmart_subscriber_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  category text NOT NULL,
  date date NOT NULL,
  person person_type NOT NULL,
  type transaction_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create recurring_expenses table
CREATE TABLE recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  category text NOT NULL,
  person person_type NOT NULL,
  type transaction_type NOT NULL,
  frequency frequency_type NOT NULL,
  due_day integer NOT NULL,
  is_active boolean DEFAULT true,
  next_due_date date NOT NULL,
  last_paid_date date,
  notification_days integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for expenses
CREATE POLICY "Users can manage own expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for categories
CREATE POLICY "Users can read own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for recurring_expenses
CREATE POLICY "Users can manage own recurring expenses"
  ON recurring_expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Get email and name from the new user
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Insert into profiles table
  INSERT INTO profiles (id, email, full_name, plan_type, subscription_status)
  VALUES (
    NEW.id,
    user_email,
    user_name,
    'free',
    'inactive'
  );
  
  -- Create default categories for the new user
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
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_next_due_date ON recurring_expenses(next_due_date);

-- Migration 4: Enhanced User Profiles and Couples System

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cakto_subscriber_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_transactions_used integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_transaction_reset date DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create couples table
CREATE TABLE couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create invitations table
CREATE TABLE invitations (
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
CREATE TABLE notifications (
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
CREATE TABLE subscription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  old_plan text,
  new_plan text,
  cakto_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add couple_id to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS couple_id uuid REFERENCES couples(id) ON DELETE CASCADE;

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
CREATE INDEX idx_couples_user1_id ON couples(user1_id);
CREATE INDEX idx_couples_user2_id ON couples(user2_id);
CREATE INDEX idx_invitations_sender_id ON invitations(sender_id);
CREATE INDEX idx_invitations_recipient_email ON invitations(recipient_email);
CREATE INDEX idx_invitations_recipient_id ON invitations(recipient_id);
CREATE INDEX idx_notifications_target_users ON notifications(target_users);
CREATE INDEX idx_subscription_logs_user_id ON subscription_logs(user_id);
CREATE INDEX idx_expenses_couple_id ON expenses(couple_id);

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

-- Set admin flag for the specified email (will be set when user registers)
-- UPDATE profiles SET is_admin = true WHERE email = 'marciojunior1993@gmail.com';

-- Success message
SELECT 'Database reset completed successfully! All tables recreated and migrations applied.' as result;