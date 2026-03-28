import { getSessionToken } from '../lib/storage'
import { getDiagnosticResults as apiGetResults, saveDiagnosticResult as apiSaveResult } from '../lib/api'
import type { DiagnosticResult, LegacyDiagnosticResult, TendencyId } from '../types'

function mapApiResultToDiagnostic(r: {
  id: string
  user_id: string
  completed_at: string
  subscales: Record<string, number>
  tendencies: Record<string, number>
  zones_support: string[]
  zones_middle: string[]
  zones_risk: string[]
  risk_signal: boolean
  interpretation: string
}): DiagnosticResult {
  return {
    id: r.id,
    userId: r.user_id,
    completedAt: r.completed_at,
    subscales: r.subscales as DiagnosticResult['subscales'],
    tendencies: r.tendencies as DiagnosticResult['tendencies'],
    zonesSupport: r.zones_support as TendencyId[],
    zonesMiddle: r.zones_middle as TendencyId[],
    zonesRisk: r.zones_risk as TendencyId[],
    riskSignal: r.risk_signal,
    interpretation: r.interpretation,
  }
}

export async function getUserDiagnosticResults(): Promise<(DiagnosticResult | LegacyDiagnosticResult)[]> {
  const token = getSessionToken()
  if (!token) return []
  try {
    const list = await apiGetResults(token)
    const arr = Array.isArray(list) ? list : (list?.data ?? list?.results ?? [])
    return arr.map((r: Record<string, unknown>) =>
      mapApiResultToDiagnostic({
        id: r.id as string,
        user_id: r.user_id as string,
        completed_at: r.completed_at as string,
        subscales: (r.subscales ?? {}) as Record<string, number>,
        tendencies: (r.tendencies ?? {}) as Record<string, number>,
        zones_support: (r.zones_support ?? []) as string[],
        zones_middle: (r.zones_middle ?? []) as string[],
        zones_risk: (r.zones_risk ?? []) as string[],
        risk_signal: Boolean(r.risk_signal),
        interpretation: (r.interpretation ?? '') as string,
      }),
    )
  } catch {
    return []
  }
}

export function saveDiagnosticResult(
  result: Omit<DiagnosticResult, 'id' | 'userId' | 'completedAt'>,
): Promise<void> | void {
  const token = getSessionToken()
  if (!token) {
    return Promise.reject(new Error('Нет сессии. Войдите снова.'))
  }
  return apiSaveResult(token, {
    subscales: result.subscales,
    tendencies: result.tendencies,
    zonesSupport: result.zonesSupport,
    zonesMiddle: result.zonesMiddle,
    zonesRisk: result.zonesRisk,
    riskSignal: result.riskSignal,
    interpretation: result.interpretation,
  }) as Promise<unknown> as Promise<void>
}
