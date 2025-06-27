/*
  # Fix invitation premium view policies

  1. Security Policies
    - Add policies for invitations table
    - Add policies for profiles table
    - Enable RLS on both tables

  2. Changes Made
    - Removed problematic view creation
    - Added direct table policies for secure access
    - Ensured proper RLS configuration
*/

-- Enable RLS on invitations table if not already enabled
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table if not already enabled  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Inviter can view own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Recipient can view own invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admin can view all invitations" ON public.invitations;
DROP POLICY IF EXISTS "User or admin can view own profile" ON public.profiles;

-- INVITATION POLICIES

-- Remetente pode ver convites enviados
CREATE POLICY "Inviter can view own invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

-- Destinatário pode ver convites recebidos (por email)
CREATE POLICY "Recipient can view own invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (recipient_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

-- Admin pode ver todos os convites
CREATE POLICY "Admin can view all invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- PROFILE POLICIES

-- Users can view their own profile or admins can view all profiles
CREATE POLICY "User or admin can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INVITATION MANAGEMENT POLICIES

-- Users can create invitations
CREATE POLICY "Users can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Users can update their own invitations (sender or recipient)
CREATE POLICY "Users can update own invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid() 
    OR recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    sender_id = auth.uid() 
    OR recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Allow sender to delete own invitations
CREATE POLICY "Allow sender to delete own invitations"
  ON public.invitations FOR DELETE
  TO public
  USING (sender_id = auth.uid());