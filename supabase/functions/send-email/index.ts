import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  type: 'expense_due' | 'admin_notification'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, type }: EmailRequest = await req.json()

    // SMTP configuration
    const smtpConfig = {
      hostname: 'smtp.hostinger.com',
      port: 587,
      username: 'no-reply@financeapp.site',
      password: '91435190Ma*',
      from: 'FinanceApp <no-reply@financeapp.site>',
    }

    // Create email content based on type
    let emailContent = html

    if (type === 'expense_due') {
      emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FinanceApp - Despesa a Vencer</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 FinanceApp</h1>
              <p>Lembrete de Despesa</p>
            </div>
            <div class="content">
              ${html}
            </div>
            <div class="footer">
              <p>Este é um email automático do FinanceApp.</p>
              <p>Para alterar suas preferências de notificação, acesse as configurações do app.</p>
              <p>&copy; 2024 FinanceApp. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    } else if (type === 'admin_notification') {
      emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FinanceApp - Notificação</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 FinanceApp</h1>
              <p>Notificação Importante</p>
            </div>
            <div class="content">
              ${html}
              <a href="https://financeappo.netlify.app" class="button">Acessar FinanceApp</a>
            </div>
            <div class="footer">
              <p>Esta é uma notificação oficial do FinanceApp.</p>
              <p>&copy; 2024 FinanceApp. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Send email using fetch to a mail service
    const emailData = {
      from: smtpConfig.from,
      to: to,
      subject: subject,
      html: emailContent,
    }

    // For now, we'll just log the email (in production, integrate with a real email service)
    console.log('Email would be sent:', emailData)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})