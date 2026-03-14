// Supabase Edge Function: получение и сохранение результатов диагностики.
// Authorization: Bearer <token> (токен из telegram-auth).

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
  const key = await crypto.subtle.importKey(
    'raw',
    encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encode(payloadStr))
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
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

  const userId = payload.sub
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('diagnostic_results')
      .select('id, user_id, completed_at, subscales, tendencies, zones_support, zones_middle, zones_risk, risk_signal, interpretation')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const list = (data ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      completed_at: r.completed_at,
      subscales: r.subscales,
      tendencies: r.tendencies,
      zones_support: r.zones_support ?? [],
      zones_middle: r.zones_middle ?? [],
      zones_risk: r.zones_risk ?? [],
      risk_signal: r.risk_signal,
      interpretation: r.interpretation ?? '',
    }))
    return new Response(JSON.stringify(list), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  if (req.method === 'POST') {
    let body: {
      subscales?: Record<string, number>
      tendencies?: Record<string, number>
      zonesSupport?: string[]
      zonesMiddle?: string[]
      zonesRisk?: string[]
      riskSignal?: boolean
      interpretation?: string
    }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    // Пересохраняем: удаляем старые результаты пользователя, сохраняем один новый
    const { error: deleteError } = await supabase
      .from('diagnostic_results')
      .delete()
      .eq('user_id', userId)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const { data, error } = await supabase
      .from('diagnostic_results')
      .insert({
        user_id: userId,
        subscales: body.subscales ?? {},
        tendencies: body.tendencies ?? {},
        zones_support: body.zonesSupport ?? [],
        zones_middle: body.zonesMiddle ?? [],
        zones_risk: body.zonesRisk ?? [],
        risk_signal: Boolean(body.riskSignal),
        interpretation: body.interpretation ?? '',
      })
      .select('id, completed_at')
      .single()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ id: data.id, completed_at: data.completed_at }), {
      status: 201,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
