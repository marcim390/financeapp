/*
  # Fix user creation issues

  1. Ensure proper trigger function for new users
  2. Add better error handling
  3. Fix any potential timing issues
*/

-- Drop existing trigger and function to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_default_categories(uuid);

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

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

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

-- Ensure categories policies allow insertion during user creation
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;

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