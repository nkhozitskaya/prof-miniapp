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

export type UserProfile = {
  user_id: string
  display_name: string | null
  age: number | null
  phone: string | null
  email: string | null
  role: 'teen' | 'parent' | null
  created_at: string
  updated_at: string
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

export async function getUserProfile(token: string): Promise<UserProfile | null> {
  const res = await fetch(`${BASE}/functions/v1/user-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Profile load failed: ${res.status}`)
  }
  return res.json() as Promise<UserProfile | null>
}

export async function saveUserProfile(
  token: string,
  payload: {
    displayName?: string
    age?: number | null
    phone?: string
    email?: string
    role?: 'teen' | 'parent' | null
  },
): Promise<UserProfile> {
  const res = await fetch(`${BASE}/functions/v1/user-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Profile save failed: ${res.status}`)
  }
  return res.json() as Promise<UserProfile>
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

export type ChildListItem = {
  id: string
  telegram_user_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  created_at: string
}

export async function parentCreateLinkInvite(token: string, opts?: { days?: number; maxUses?: number }) {
  const res = await fetch(`${BASE}/functions/v1/parent-link-invite-create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(opts ?? {}),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Invite create failed: ${res.status}`)
  }
  return res.json() as Promise<{ code: string; expires_at: string; max_uses: number; uses: number }>
}

export async function childAcceptLink(token: string, code: string) {
  const res = await fetch(`${BASE}/functions/v1/child-link-accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Link failed: ${res.status}`)
  }
  return res.json() as Promise<{ ok: true; parent_user_id: string; child_user_id: string }>
}

export async function parentListChildren(token: string): Promise<ChildListItem[]> {
  const res = await fetch(`${BASE}/functions/v1/parent-children-list`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Children list failed: ${res.status}`)
  }
  return res.json() as Promise<ChildListItem[]>
}

export async function childListParents(token: string): Promise<ChildListItem[]> {
  const res = await fetch(`${BASE}/functions/v1/child-parents-list`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Parents list failed: ${res.status}`)
  }
  return res.json() as Promise<ChildListItem[]>
}

export async function parentGetChildDashboard(token: string, childId: string) {
  const url = new URL(`${BASE}/functions/v1/parent-child-dashboard`)
  url.searchParams.set('child_id', childId)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Dashboard failed: ${res.status}`)
  }
  return res.json() as Promise<{
    child: ChildListItem | null
    child_diagnostic: any | null
    profession_trials: any[]
    entitlements: any[]
    parent_assessment: any | null
    purchase_requests: any[]
  }>
}

export async function trackProfessionTrial(token: string, payload: { professionId: string; status: 'started' | 'completed' | 'cancelled'; result?: unknown }) {
  const res = await fetch(`${BASE}/functions/v1/profession-trial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Track failed: ${res.status}`)
  }
  return res.json()
}

export type PurchaseRequestRow = {
  id: string
  sku: string
  status: 'requested' | 'approved' | 'declined' | 'paid'
  created_at: string
  updated_at: string
  child_user_id: string
  parent_user_id: string
}

export async function createPurchaseRequest(token: string, parentUserId: string, sku: string): Promise<PurchaseRequestRow> {
  const res = await fetch(`${BASE}/functions/v1/purchase-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'create', parentUserId, sku }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Request create failed: ${res.status}`)
  }
  return res.json() as Promise<PurchaseRequestRow>
}

export async function updatePurchaseRequest(token: string, requestId: string, status: 'approved' | 'declined' | 'paid'): Promise<PurchaseRequestRow> {
  const res = await fetch(`${BASE}/functions/v1/purchase-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'update', requestId, status }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Request update failed: ${res.status}`)
  }
  return res.json() as Promise<PurchaseRequestRow>
}

export async function grantEntitlement(token: string, childUserId: string, sku: string, source: string = 'grant') {
  const res = await fetch(`${BASE}/functions/v1/purchase-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'grant', childUserId, sku, source }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Grant failed: ${res.status}`)
  }
  return res.json()
}

export async function listPurchaseRequests(token: string, scope: 'child' | 'parent'): Promise<PurchaseRequestRow[]> {
  const url = new URL(`${BASE}/functions/v1/purchase-request`)
  url.searchParams.set('scope', scope)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Request list failed: ${res.status}`)
  }
  return res.json() as Promise<PurchaseRequestRow[]>
}
