// Supabase Edge Function: child accepts parent invite code and links accounts.
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

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  const code = (body.code ?? '').trim().toUpperCase()
  if (!code) {
    return new Response(JSON.stringify({ error: 'Missing code' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  const { data: invite, error: inviteError } = await supabase
    .from('link_invites')
    .select('id, parent_user_id, code, expires_at, max_uses, uses')
    .eq('code', code)
    .single()

  if (inviteError || !invite) {
    return new Response(JSON.stringify({ error: 'Код не найден' }), {
      status: 404,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return new Response(JSON.stringify({ error: 'Код истёк' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  if (Number(invite.uses) >= Number(invite.max_uses)) {
    return new Response(JSON.stringify({ error: 'Код уже использован' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const childUserId = payload.sub
  const parentUserId = invite.parent_user_id as string
  if (childUserId === parentUserId) {
    return new Response(JSON.stringify({ error: 'Нельзя привязать самого себя' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const { error: linkError } = await supabase
    .from('parent_child_links')
    .upsert({ parent_user_id: parentUserId, child_user_id: childUserId, status: 'active' }, { onConflict: 'parent_user_id,child_user_id' })

  if (linkError) {
    return new Response(JSON.stringify({ error: linkError.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const { error: usesError } = await supabase
    .from('link_invites')
    .update({ uses: Number(invite.uses) + 1 })
    .eq('id', invite.id)

  if (usesError) {
    return new Response(JSON.stringify({ error: usesError.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, parent_user_id: parentUserId, child_user_id: childUserId }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})

