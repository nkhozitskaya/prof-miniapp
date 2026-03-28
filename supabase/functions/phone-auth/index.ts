// Вход по телефону (браузер): upsert в users, тот же JWT что и telegram-auth.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function encode(s: string): Uint8Array {
  return new TextEncoder().encode(s)
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

/** Нормализация к виду +79XXXXXXXXX (РФ). */
function normalizePhoneRu(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 0) return null
  let d = digits
  if (d.startsWith('8') && d.length === 11) d = '7' + d.slice(1)
  if (d.startsWith('9') && d.length === 10) d = '7' + d
  if (d.length === 10 && !d.startsWith('7')) d = '7' + d
  if (d.startsWith('7') && d.length === 11) return `+${d}`
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const jwtSecret = Deno.env.get('JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? 'change-me'

  let body: { phone?: string; first_name?: string; last_name?: string; age?: number }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const phone = normalizePhoneRu(String(body.phone ?? ''))
  if (!phone) {
    return new Response(JSON.stringify({ error: 'Некорректный номер телефона' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const first = String(body.first_name ?? '').trim() || null
  const last = String(body.last_name ?? '').trim() || null
  let age: number | null = typeof body.age === 'number' && Number.isFinite(body.age) ? Math.round(body.age) : null
  if (age !== null && (age < 10 || age > 99)) age = null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: existing } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle()

  let row: {
    id: string
    telegram_user_id: number | null
    phone: string | null
    first_name: string | null
    last_name: string | null
    username: string | null
    age: number | null
  }

  if (existing?.id) {
    const { data: updated, error: uerr } = await supabase
      .from('users')
      .update({
        first_name: first,
        last_name: last,
        age,
      })
      .eq('id', existing.id)
      .select('id, telegram_user_id, phone, first_name, last_name, username, age')
      .single()
    if (uerr || !updated) {
      return new Response(JSON.stringify({ error: uerr?.message ?? 'Update failed' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    row = updated
  } else {
    const { data: inserted, error: ierr } = await supabase
      .from('users')
      .insert({
        telegram_user_id: null,
        phone,
        first_name: first,
        last_name: last,
        username: null,
        age,
      })
      .select('id, telegram_user_id, phone, first_name, last_name, username, age')
      .single()
    if (ierr || !inserted) {
      return new Response(JSON.stringify({ error: ierr?.message ?? 'Insert failed' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    row = inserted
  }

  const token = await signToken(
    { sub: row.id, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 },
    jwtSecret,
  )

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
