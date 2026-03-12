/**
 * API для работы в Telegram: авторизация по initData и сохранение/загрузка результатов диагностики.
 * Base URL задаётся через VITE_API_URL (Supabase project URL или твой бэкенд).
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

export type ApiUser = {
  id: string
  telegram_user_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
}

export type AuthResponse = {
  user: ApiUser
  token: string
}

export async function authTelegram(initData: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/functions/v1/telegram-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Auth failed: ${res.status}`)
  }
  return res.json() as Promise<AuthResponse>
}

export async function getDiagnosticResults(token: string) {
  const res = await fetch(`${BASE}/functions/v1/diagnostic`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load results: ${res.status}`)
  return res.json()
}

export async function saveDiagnosticResult(
  token: string,
  result: {
    subscales: Record<string, number>
    tendencies: Record<string, number>
    zonesSupport: string[]
    zonesMiddle: string[]
    zonesRisk: string[]
    riskSignal: boolean
    interpretation: string
  },
) {
  const res = await fetch(`${BASE}/functions/v1/diagnostic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(result),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Save failed: ${res.status}`)
  }
  return res.json()
}
