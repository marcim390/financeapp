import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Set the auth context
    supabase.auth.setAuth(authHeader.replace('Bearer ', ''))

    const { email, invitedById, invitedByIsPremium } = await req.json()

    if (!email || !invitedById) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email and invitedById are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Use the improved RPC function
    const { data, error } = await supabase.rpc('send_couple_invitation_improved', {
      _recipient_email: email
    })

    if (error) {
      console.error('Error sending invitation:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!data.success) {
      return new Response(
        JSON.stringify({ success: false, error: data.error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send email notification
    try {
      const appUrl = 'https://financeappo.netlify.app'
      const inviteLink = `${appUrl}/auth/set-password?email=${encodeURIComponent(email)}`
      
      const emailPayload = {
        from: 'FinanceApp <no-reply@financeapp.site>',
        to: email,
        subject: 'Você foi convidado para o FinanceApp!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Você foi convidado para o FinanceApp!</h2>
            <p>Olá,</p>
            <p>Você foi convidado para compartilhar o controle financeiro no <b>FinanceApp</b>.</p>
            <p>Para começar, defina sua senha clicando no botão abaixo:</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" style="background: #2563eb; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-size: 18px;">Definir Senha</a>
            </p>
            <p>Se você já tem cadastro, basta acessar normalmente.</p>
            <hr style="margin: 32px 0;" />
            <p style="font-size: 13px; color: #888;">Se não reconhece este convite, ignore este e-mail.</p>
          </div>
        `
      }

      // Send email using Resend API
      const RESEND_API_KEY = 're_BbHCREA4_K9z1UJQtzE3ftjuCdUoQPcr8'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the invitation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso!',
        invitation_id: data.invitation_id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erro inesperado: ' + error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})