// Supabase Edge Function: create/update profession trial progress for child.
// Authorization: Bearer <token> (token from telegram-auth).
//
// POST { professionId, status, result? }
// GET  -> list for current child

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const auth = req.headers.get('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  const secret = Deno.env.get('JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? 'change-me'
  const payload = await verifyToken(token, secret)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const childUserId = payload.sub
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('profession_trials')
      .select('id, profession_id, status, result, started_at, completed_at')
      .eq('child_user_id', childUserId)
      .order('started_at', { ascending: false })
      .limit(100)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(data ?? []), { headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  if (req.method === 'POST') {
    let body: { professionId?: string; status?: string; result?: unknown }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const professionId = String(body.professionId ?? '').trim()
    const status = String(body.status ?? '').trim()
    if (!professionId || !['started', 'completed', 'cancelled'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    if (status === 'started') {
      const { data, error } = await supabase
        .from('profession_trials')
        .insert({ child_user_id: childUserId, profession_id: professionId, status: 'started', result: body.result ?? {} })
        .select('id, profession_id, status, started_at')
        .single()
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify(data), { status: 201, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    // completed/cancelled: update the latest started trial for that profession
    const { data: last } = await supabase
      .from('profession_trials')
      .select('id')
      .eq('child_user_id', childUserId)
      .eq('profession_id', professionId)
      .order('started_at', { ascending: false })
      .limit(1)
    const id = (last ?? [])[0]?.id
    if (!id) {
      return new Response(JSON.stringify({ error: 'No trial found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const { data, error } = await supabase
      .from('profession_trials')
      .update({ status, result: body.result ?? {}, completed_at: status === 'completed' ? new Date().toISOString() : null })
      .eq('id', id)
      .select('id, profession_id, status, result, started_at, completed_at')
      .single()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})

