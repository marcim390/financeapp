
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'

const ALLOWED_ORIGIN = 'https://financeappo.netlify.app';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  try {
    const { email, invitedById, invitedByIsPremium } = await req.json()


    // 1. Cria usuário no Auth (ou pega o existente) sem disparar e-mail padrão do Supabase
    let userId: string | undefined
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false, // não dispara e-mail, usuário será ativado ao definir senha
      // Garante que o Supabase NÃO envie e-mail de convite
      // O parâmetro "email_confirm: false" já previne o envio, mas reforçamos para versões futuras
      // Se "invited" ou "send_email_invite" existirem, mantenha-os como false
    })
    if (error) {
      // Log detalhado do erro
      console.error('Erro ao criar usuário:', error)
      if (error.message !== 'User already registered') {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Max-Age': '86400',
            'Content-Type': 'application/json',
          },
        })
      }
    }
    if (user?.user?.id) {
      userId = user.user.id
      console.log('Usuário criado via createUser:', userId)
    } else {
      // Se já existe, busca pelo e-mail
      const { data: existingUser, error: fetchUserError } = await supabase.auth.admin.listUsers({ email })
      if (fetchUserError) {
        console.error('Erro ao buscar usuário existente:', fetchUserError)
        return new Response(JSON.stringify({ error: 'Não foi possível obter o usuário.' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Max-Age': '86400',
            'Content-Type': 'application/json',
          },
        })
      }
      if (!existingUser?.users?.[0]?.id) {
        console.error('Usuário não encontrado no Auth:', existingUser)
        return new Response(JSON.stringify({ error: 'Usuário não encontrado no Auth.' }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Max-Age': '86400',
            'Content-Type': 'application/json',
          },
        })
      }
      userId = existingUser.users[0].id
      console.log('Usuário já existia no Auth:', userId)
    }

    if (!userId) {
      console.error('userId indefinido após tentativa de criação/busca.')
      return new Response(JSON.stringify({ error: 'userId indefinido.' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
      })
    }

    // 2. Cria ou atualiza profile já com plano correto
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        plan_type: invitedByIsPremium ? 'premium' : 'free',
        subscription_status: invitedByIsPremium ? 'active' : 'inactive',
        invited_by: invitedById,
        is_admin: false,
        monthly_transactions_used: 0,
        last_transaction_reset: new Date().toISOString(),
        full_name: null,
        avatar_url: null,
        phone: null,
        address: null,
        gender: null,
        subscription_expires_at: null,
        hotmart_subscriber_code: null,
        cakto_subscriber_id: null,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    if (profileError) {
      console.error('Erro ao criar/atualizar profile:', profileError)
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Max-Age': '86400',
          'Content-Type': 'application/json',
        },
      })
    }


    // 3. Cria invitation (só se não existir convite pendente)
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('recipient_email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (!existingInvitation) {
      const { error: invitationError } = await supabase.from('invitations').insert({
        sender_id: invitedById,
        recipient_email: email,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      if (invitationError) {
        console.error('Erro ao criar invitation:', invitationError)
        return new Response(JSON.stringify({ error: invitationError.message }), {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Max-Age': '86400',
            'Content-Type': 'application/json',
          },
        })
      }

      // Envio de e-mail customizado (além do invite padrão do Supabase)
      try {
        const senderProfile = await supabase.from('profiles').select('full_name, email').eq('id', invitedById).maybeSingle();
        const senderName = senderProfile?.data?.full_name || 'Seu parceiro(a)';
        const senderEmail = senderProfile?.data?.email || '';
        // Link de definição de senha (customizado, não dispara e-mail do Supabase)
        const appUrl = 'https://financeappo.netlify.app';
        const inviteLink = `${appUrl}/auth/set-password?email=${encodeURIComponent(email)}`;
        // Envio via Resend API (ou outro SMTP/provider)
        const emailPayload = {
          from: 'FinanceApp <no-reply@financeapp.site>',
          to: email,
          subject: 'Você foi convidado para o FinanceApp!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>Você foi convidado para o FinanceApp!</h2>
              <p>Olá,</p>
              <p><b>${senderName}</b> (${senderEmail}) te convidou para compartilhar o controle financeiro no <b>FinanceApp</b>.</p>
              <p>Para começar, defina sua senha clicando no botão abaixo:</p>
              <p style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="background: #2563eb; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 18px;">Definir Senha</a>
              </p>
              <p>Se você já tem cadastro, basta acessar normalmente.</p>
              <hr style="margin: 32px 0;" />
              <p style="font-size: 13px; color: #888;">Se não reconhece este convite, ignore este e-mail.</p>
            </div>
          `
        };
        // Exemplo: chamada para Resend API (ou troque pelo seu provider)
        const RESEND_API_KEY = 're_BbHCREA4_K9z1UJQtzE3ftjuCdUoQPcr8';
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });
      } catch (emailErr) {
        console.error('Erro ao enviar e-mail customizado:', emailErr);
      }
    }

    console.log('Fluxo concluído com sucesso para:', email)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    console.error('Erro inesperado:', err)
    return new Response(JSON.stringify({ error: 'Erro inesperado: ' + err }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
      },
    })
  }
})