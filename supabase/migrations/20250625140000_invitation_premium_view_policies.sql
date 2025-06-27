-- Migration: View e policies para fluxo de convite premium seguro
-- Data: 2025-06-25

-- 1. VIEW AUXILIAR PARA LEITURA DE PLANO
CREATE OR REPLACE VIEW public.profile_plans AS
SELECT id, plan_type
FROM public.profiles;

-- 2. POLICY DE SELECT NA VIEW (qualquer autenticado pode ler id/plan_type)
DROP POLICY IF EXISTS "Authenticated can read plan_type" ON public.profile_plans;
CREATE POLICY "Authenticated can read plan_type"
  ON public.profile_plans FOR SELECT
  USING (auth.role() = 'authenticated');

ALTER VIEW public.profile_plans ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES DE SELECT NA TABELA invitations

-- Remetente pode ver convites enviados
DROP POLICY IF EXISTS "Inviter can view own invitations" ON public.invitations;
CREATE POLICY "Inviter can view own invitations"
  ON public.invitations FOR SELECT
  USING (sender_id = auth.uid());

-- Destinatário pode ver convites recebidos (por email)
DROP POLICY IF EXISTS "Recipient can view own invitations" ON public.invitations;
CREATE POLICY "Recipient can view own invitations"
  ON public.invitations FOR SELECT
  USING (recipient_email = auth.email());

-- Admin pode ver todos os convites
DROP POLICY IF EXISTS "Admin can view all invitations" ON public.invitations;
CREATE POLICY "Admin can view all invitations"
  ON public.invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 4. (Opcional) Policy de SELECT restritiva na tabela profiles (para evitar exposição acidental)
DROP POLICY IF EXISTS "User or admin can view own profile" ON public.profiles;
CREATE POLICY "User or admin can view own profile"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
