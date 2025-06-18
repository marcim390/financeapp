/*
  # Insert Default Categories for New Users

  1. Function to create default categories
    - Creates a function that inserts default categories for new users
    - Called automatically when a new profile is created

  2. Default Categories
    - Alimentação (Food)
    - Transporte (Transport)
    - Saúde (Health)
    - Entretenimento (Entertainment)
    - Casa (Home)
    - Educação (Education)
    - Outros (Others)
*/

-- Create function to insert default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (user_id, name, color, icon) VALUES
    (user_id, 'Alimentação', '#ef4444', 'UtensilsCrossed'),
    (user_id, 'Transporte', '#3b82f6', 'Car'),
    (user_id, 'Saúde', '#10b981', 'Heart'),
    (user_id, 'Entretenimento', '#f59e0b', 'Gamepad2'),
    (user_id, 'Casa', '#8b5cf6', 'Home'),
    (user_id, 'Educação', '#06b6d4', 'GraduationCap'),
    (user_id, 'Outros', '#6b7280', 'MoreHorizontal');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to include default categories
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create default categories for the new user
  PERFORM create_default_categories(new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;