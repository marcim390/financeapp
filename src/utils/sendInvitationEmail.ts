import { supabase } from '../lib/supabase';

export async function sendInvitationEmail({ to, invitationId }: { to: string; invitationId: string }) {
  // Use variável de ambiente para garantir URL de produção
  const BASE_URL = import.meta.env.VITE_PUBLIC_APP_URL || "https://financeappo.netlify.app";
  const inviteLink = `${BASE_URL}/register?invitation=${invitationId}`;

  const html = `
    <h2>Você foi convidado para o FinanceApp!</h2>
    <p>Para acessar o sistema, clique no link abaixo para criar sua senha:</p>
    <a href="${inviteLink}">Criar senha e acessar</a>
    <p>Se você não esperava este convite, ignore este e-mail.</p>
  `;

  // Chame a função edge/send-email
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to,
      subject: 'Convite para o FinanceApp',
      html,
      type: 'admin_notification',
    },
  });

  if (error) {
    console.error('Erro ao enviar e-mail de convite:', error);
    return { error };
  }
  return { error: null };
}
