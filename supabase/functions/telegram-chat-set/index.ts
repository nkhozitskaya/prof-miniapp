// Supabase Edge Function: set chat_id for user (called by bot backend).
// Protected by BOT_INTERNAL_SECRET header.
//
// POST { userId, chatId }
// Header: x-bot-secret: <BOT_INTERNAL_SECRET>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-bot-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const expected = Deno.env.get('BOT_INTERNAL_SECRET') ?? ''
  const got = req.headers.get('x-bot-secret') ?? ''
  if (!expected || got !== expected) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let body: { userId?: string; chatId?: number }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const userId = String(body.userId ?? '')
  const chatId = Number(body.chatId)
  if (!userId || !Number.isFinite(chatId)) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const { data, error } = await supabase
    .from('telegram_chats')
    .upsert({ user_id: userId, chat_id: chatId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('user_id, chat_id, updated_at')
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } })
})

