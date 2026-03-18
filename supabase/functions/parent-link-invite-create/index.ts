// Supabase Edge Function: parent creates invite code to link a child.
// Authorization: Bearer <token> (token from telegram-auth).

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

function makeCode(len = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0O1I
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < len; i += 1) out += alphabet[bytes[i] % alphabet.length]
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

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

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  let body: { days?: number; maxUses?: number }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const days = Math.max(1, Math.min(30, Number(body.days ?? 7)))
  const maxUses = Math.max(1, Math.min(10, Number(body.maxUses ?? 1)))
  const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString()

  // Try a few times for uniqueness
  let lastError: string | null = null
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeCode(8)
    const { data, error } = await supabase
      .from('link_invites')
      .insert({ parent_user_id: payload.sub, code, expires_at: expiresAt, max_uses: maxUses, uses: 0 })
      .select('code, expires_at, max_uses, uses')
      .single()
    if (!error && data) {
      return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    lastError = error?.message ?? 'Insert failed'
  }

  return new Response(JSON.stringify({ error: lastError ?? 'Failed to create invite' }), {
    status: 500,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})

