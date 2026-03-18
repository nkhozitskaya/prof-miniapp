// Supabase Edge Function: parent dashboard for a child (child diag, trials, entitlements, parent assessments).
// Authorization: Bearer <token> (token from telegram-auth).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  if (req.method !== 'GET') {
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

  const url = new URL(req.url)
  const childId = url.searchParams.get('child_id')
  if (!childId) {
    return new Response(JSON.stringify({ error: 'Missing child_id' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const parentId = payload.sub
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  const { data: link, error: linkError } = await supabase
    .from('parent_child_links')
    .select('id, status')
    .eq('parent_user_id', parentId)
    .eq('child_user_id', childId)
    .eq('status', 'active')
    .maybeSingle()

  if (linkError) {
    return new Response(JSON.stringify({ error: linkError.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
  if (!link) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const [{ data: child }, { data: diag }, { data: trials }, { data: entitlements }, { data: assessments }, { data: requests }] =
    await Promise.all([
      supabase.from('users').select('id, telegram_user_id, first_name, last_name, username, created_at').eq('id', childId).single(),
      supabase
        .from('diagnostic_results')
        .select('id, user_id, completed_at, subscales, tendencies, zones_support, zones_middle, zones_risk, risk_signal, interpretation')
        .eq('user_id', childId)
        .order('completed_at', { ascending: false })
        .limit(1),
      supabase
        .from('profession_trials')
        .select('id, profession_id, status, result, started_at, completed_at')
        .eq('child_user_id', childId)
        .order('started_at', { ascending: false })
        .limit(50),
      supabase.from('entitlements').select('id, sku, source, active, created_at, expires_at').eq('child_user_id', childId).order('created_at', { ascending: false }),
      supabase
        .from('parent_assessments')
        .select('id, completed_at, payload, result')
        .eq('parent_user_id', parentId)
        .eq('child_user_id', childId)
        .order('completed_at', { ascending: false })
        .limit(1),
      supabase
        .from('purchase_requests')
        .select('id, sku, status, created_at, updated_at, child_user_id, parent_user_id')
        .eq('parent_user_id', parentId)
        .eq('child_user_id', childId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

  return new Response(
    JSON.stringify({
      child: child ?? null,
      child_diagnostic: (diag ?? [])[0] ?? null,
      profession_trials: trials ?? [],
      entitlements: entitlements ?? [],
      parent_assessment: (assessments ?? [])[0] ?? null,
      purchase_requests: requests ?? [],
    }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  )
})

