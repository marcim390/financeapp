import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js'

const ALLOWED_ORIGIN = 'https://financeappo.netlify.app';

serve(async (req) => {
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
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'E-mail e senha são obrigatórios.' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Content-Type': 'application/json',
        },
      });
    }
    // Busca o usuário pelo e-mail
    const { data, error: fetchError } = await supabase.auth.admin.listUsers({ email });
    if (fetchError || !data?.users?.[0]?.id) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado.' }), {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Content-Type': 'application/json',
        },
      });
    }
    const userId = data.users[0].id;
    // Atualiza a senha
    const { error: updateError } = await supabase.auth.admin.updateUser(userId, { password });
    if (updateError) {
      return new Response(JSON.stringify({ error: 'Erro ao definir senha.' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Content-Type': 'application/json',
        },
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro inesperado: ' + err }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Content-Type': 'application/json',
      },
    });
  }
});
