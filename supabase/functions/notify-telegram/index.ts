// Supabase Edge Function: send Telegram message via Bot API to a linked user.
// Authorization: Bearer <token> (token from telegram-auth).
//
// POST { toUserId, text }
// - Allowed when toUserId == current user
// - Or when current user is parent and toUserId is a linked child
// - Or when current user is child and toUserId is a linked parent
//
// Requires secrets:
// - TELEGRAM_BOT_TOKEN (bot token)
// Also requires telegram_chats table filled by bot backend (chat_id).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function encode(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function decodeBase64Url(b64: string): string {
  const pad = b64.length % 4
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(new Uint8Array([...binary].map((c) => c.charCodeAt(0))))
}

async function verifyToken(token: string, secret: string): Promise<{ sub: string } | null> {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts
  let payloadStr: string
  try {
    payloadStr = decodeBase64Url(payloadB64)
  } catch {
    return null
  }
  const payload = JSON.parse(payloadStr) as { sub?: string; exp?: number }
  if (!payload.sub || typeof payload.exp !== 'number') return null
  if (payload.exp < Date.now() / 1000) return null
  const key = await crypto.subtle.importKey('raw', encode(secret), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encode(payloadStr))
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  if (sigB64 !== expectedB64) return null
  return { sub: payload.sub }
}

async function isLinked(supabase: any, a: string, b: string): Promise<boolean> {
  const { data: ab } = await supabase
    .from('parent_child_links')
    .select('id')
    .eq('parent_user_id', a)
    .eq('child_user_id', b)
    .eq('status', 'active')
    .maybeSingle()
  if (ab) return true
  const { data: ba } = await supabase
    .from('parent_child_links')
    .select('id')
    .eq('parent_user_id', b)
    .eq('child_user_id', a)
    .eq('status', 'active')
    .maybeSingle()
  return Boolean(ba)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
  if (!botToken) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const auth = req.headers.get('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })

  const secret = Deno.env.get('JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? 'change-me'
  const payload = await verifyToken(token, secret)
  if (!payload) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })

  let body: { toUserId?: string; text?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const toUserId = String(body.toUserId ?? '')
  const text = String(body.text ?? '').trim()
  if (!toUserId || !text) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const fromUserId = payload.sub
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  if (toUserId !== fromUserId) {
    const linked = await isLinked(supabase, fromUserId, toUserId)
    if (!linked) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const { data: chatRow } = await supabase.from('telegram_chats').select('chat_id').eq('user_id', toUserId).single()
  const chatId = chatRow?.chat_id
  if (!chatId) {
    return new Response(JSON.stringify({ error: 'No chat_id for user' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Telegram send failed', details: json }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})

