// Supabase Edge Function: авторизация по Telegram initData.
// Переменная окружения: TELEGRAM_BOT_TOKEN (токен бота от BotFather).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function encode(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

async function hmacSha256(keyBytes: ArrayBuffer, messageBytes: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, messageBytes)
  return sig
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function validateInitData(initData: string, botToken: string): Promise<Record<string, string> | null> {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  const dataCheckString = sorted.map(([k, v]) => `${k}=${v}`).join('\n')
  const secretKey = await hmacSha256(encode('WebAppData'), encode(botToken))
  const computedHash = await hmacSha256(secretKey, encode(dataCheckString))
  if (toHex(computedHash) !== hash) return null
  const authDate = params.get('auth_date')
  if (authDate) {
    const age = Date.now() / 1000 - Number(authDate)
    if (age > 86400) return null // 24 часа
  }
  return Object.fromEntries(params.entries())
}

async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = btoa(payloadStr).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const key = await crypto.subtle.importKey(
    'raw',
    encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encode(payloadStr))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${payloadB64}.${sigB64}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!botToken) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let body: { initData?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const initData = body?.initData
  if (!initData || typeof initData !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing initData' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const data = await validateInitData(initData, botToken)
  if (!data) {
    return new Response(JSON.stringify({ error: 'Invalid init data' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let userJson: string | undefined
  try {
    userJson = data.user ? decodeURIComponent(data.user) : undefined
  } catch {
    userJson = undefined
  }
  const tgUser = userJson ? (JSON.parse(userJson) as { id: number; first_name?: string; last_name?: string; username?: string }) : null
  if (!tgUser?.id) {
    return new Response(JSON.stringify({ error: 'No user in init data' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: existing } = await supabase
    .from('users')
    .select('id, telegram_user_id, phone, first_name, last_name, username, age')
    .eq('telegram_user_id', String(tgUser.id))
    .single()

  let userId: string
  let row: {
    id: string
    telegram_user_id: number | null
    phone: string | null
    first_name: string | null
    last_name: string | null
    username: string | null
    age: number | null
  }

  if (existing) {
    const { data: refreshed, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: tgUser.first_name ?? null,
        last_name: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
      })
      .eq('id', existing.id)
      .select('id, telegram_user_id, phone, first_name, last_name, username, age')
      .single()
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    userId = refreshed.id
    row = refreshed
  } else {
    const { data: inserted, error } = await supabase
      .from('users')
      .insert({
        telegram_user_id: tgUser.id,
        first_name: tgUser.first_name ?? null,
        last_name: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
      })
      .select('id, telegram_user_id, phone, first_name, last_name, username, age')
      .single()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    userId = inserted.id
    row = inserted
  }

  const jwtSecret = Deno.env.get('JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? 'change-me'
  const token = await signToken({ sub: userId, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 }, jwtSecret)

  return new Response(
    JSON.stringify({
      user: {
        id: row.id,
        telegram_user_id: row.telegram_user_id,
        phone: row.phone,
        first_name: row.first_name,
        last_name: row.last_name,
        username: row.username,
        age: row.age,
      },
      token,
    }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  )
})
