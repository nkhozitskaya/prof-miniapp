// Supabase Edge Function: purchase requests + entitlements (MVP without payments).
// Authorization: Bearer <token> (token from telegram-auth).
//
// POST /purchase-request
//  - action=create: { action:'create', parentUserId, sku }
//  - action=update: { action:'update', requestId, status:'approved'|'declined'|'paid' }
//  - action=grant:  { action:'grant', childUserId, sku, source? }
//
// GET /purchase-request?scope=child|parent&child_id?

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

async function requireLinked(supabase: any, parentId: string, childId: string): Promise<boolean> {
  const { data } = await supabase
    .from('parent_child_links')
    .select('id')
    .eq('parent_user_id', parentId)
    .eq('child_user_id', childId)
    .eq('status', 'active')
    .maybeSingle()
  return Boolean(data)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const auth = req.headers.get('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const secret = Deno.env.get('JWT_SECRET') ?? Deno.env.get('SUPABASE_JWT_SECRET') ?? 'change-me'
  const payload = await verifyToken(token, secret)
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const userId = payload.sub
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const scope = url.searchParams.get('scope') ?? 'child'
    if (scope === 'child') {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('id, sku, status, created_at, updated_at, child_user_id, parent_user_id')
        .eq('child_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify(data ?? []), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    if (scope === 'parent') {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('id, sku, status, created_at, updated_at, child_user_id, parent_user_id')
        .eq('parent_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify(data ?? []), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ error: 'Invalid scope' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  if (req.method === 'POST') {
    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const action = String(body.action ?? '')
    if (action === 'create') {
      const parentUserId = String(body.parentUserId ?? '')
      const sku = String(body.sku ?? '')
      if (!parentUserId || !sku) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
      const linked = await requireLinked(supabase, parentUserId, userId)
      if (!linked) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
      const { data, error } = await supabase
        .from('purchase_requests')
        .insert({ child_user_id: userId, parent_user_id: parentUserId, sku, status: 'requested' })
        .select('id, sku, status, created_at, updated_at, child_user_id, parent_user_id')
        .single()
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify(data), { status: 201, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    if (action === 'update') {
      const requestId = String(body.requestId ?? '')
      const status = String(body.status ?? '')
      if (!requestId || !['approved', 'declined', 'paid'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
      }
      // parent updates only their requests
      const { data: reqRow } = await supabase.from('purchase_requests').select('id, parent_user_id').eq('id', requestId).single()
      if (!reqRow || (reqRow.parent_user_id as string) !== userId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
      }
      const { data, error } = await supabase
        .from('purchase_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select('id, sku, status, created_at, updated_at, child_user_id, parent_user_id')
        .single()
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    if (action === 'grant') {
      const childUserId = String(body.childUserId ?? '')
      const sku = String(body.sku ?? '')
      const source = String(body.source ?? 'grant')
      if (!childUserId || !sku) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
      const linked = await requireLinked(supabase, userId, childUserId)
      if (!linked) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } })
      const { data, error } = await supabase
        .from('entitlements')
        .upsert({ child_user_id: childUserId, sku, source, active: true }, { onConflict: 'child_user_id,sku' })
        .select('id, sku, source, active, created_at, expires_at')
        .single()
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify(data), { status: 201, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } })
})

