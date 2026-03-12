import { STATIONS } from '../data/diagnosticStations'
import type { DiagnosticResult, SubscaleId, TendencyId } from '../types'

const SUBSCALE_IDS: SubscaleId[] = [
  'comm_breadth',
  'comm_depth',
  'research_depth',
  'analysis_breadth',
  'practical_objects',
  'practical_space',
  'creation_expression',
  'aesthetic_sensitivity',
  'resilience_physical',
  'resilience_emotional',
  'org_planning',
  'org_money_data',
]

const TENDENCY_IDS: TendencyId[] = [
  'communication',
  'analysis',
  'practical',
  'creation',
  'resilience',
  'organization',
]

/** По выбранным optionId по станциям считаем подшкалы */
export function computeSubscales(selectedByStation: Record<string, string[]>): Record<SubscaleId, number> {
  const subscales = Object.fromEntries(SUBSCALE_IDS.map((id) => [id, 0])) as Record<SubscaleId, number>

  STATIONS.forEach((station) => {
    const selectedIds = selectedByStation[station.id] ?? []
    selectedIds.forEach((optionId) => {
      const option = station.options.find((o) => o.id === optionId)
      if (!option) return
      Object.entries(option.subscales).forEach(([key, weight]) => {
        subscales[key as SubscaleId] = (subscales[key as SubscaleId] ?? 0) + weight
      })
    })
  })

  return subscales
}

/** Агрегирование в 6 склонностей */
export function aggregateTendencies(subscales: Record<SubscaleId, number>): Record<TendencyId, number> {
  const communication = (subscales.comm_breadth + subscales.comm_depth) / 2
  const analysis = subscales.research_depth * 0.6 + subscales.analysis_breadth * 0.4
  const practical = (subscales.practical_objects + subscales.practical_space) / 2
  const creation = subscales.creation_expression * 0.6 + subscales.aesthetic_sensitivity * 0.4
  const resilience = (subscales.resilience_physical + subscales.resilience_emotional) / 2
  const organization = subscales.org_planning * 0.6 + subscales.org_money_data * 0.4

  return {
    communication,
    analysis,
    practical,
    creation,
    resilience,
    organization,
  }
}

/** Определение зон: опорные (2–3), подключаемые, риск (1–2) */
function computeZones(tendencies: Record<TendencyId, number>): {
  zonesSupport: TendencyId[]
  zonesMiddle: TendencyId[]
  zonesRisk: TendencyId[]
} {
  const sorted = [...TENDENCY_IDS].sort((a, b) => tendencies[b] - tendencies[a])
  const zonesSupport = sorted.slice(0, 3)
  const zonesRisk = sorted.slice(-2)
  const zonesMiddle = sorted.slice(3, -2)
  return { zonesSupport, zonesMiddle, zonesRisk }
}

/** Риск-сигнал: любая подшкала ≤ 0 */
function hasRiskSignal(subscales: Record<SubscaleId, number>): boolean {
  return SUBSCALE_IDS.some((id) => (subscales[id] ?? 0) <= 0)
}

/** Краткая текстовая интерпретация */
function buildInterpretation(
  zonesSupport: TendencyId[],
  zonesMiddle: TendencyId[],
  zonesRisk: TendencyId[],
  riskSignal: boolean,
): string {
  const labels: Record<TendencyId, string> = {
    communication: 'Коммуникация',
    analysis: 'Анализ',
    practical: 'Практика',
    creation: 'Креативность',
    resilience: 'Устойчивость',
    organization: 'Организация',
  }
  const support = zonesSupport.map((t) => labels[t]).join(', ')
  const middle = zonesMiddle.length ? zonesMiddle.map((t) => labels[t]).join(', ') : '—'
  const risk = zonesRisk.map((t) => labels[t]).join(', ')
  let text = `Сильные стороны (опорные): ${support}. Подключаемые: ${middle}. Зоны внимания: ${risk}.`
  if (riskSignal) {
    text += ' Есть риск-сигнал по одной из подшкал — стоит обратить внимание.'
  }
  return text
}

/** Полный расчёт результата диагностики по выборам */
export function computeDiagnosticResult(
  userId: string,
  selectedByStation: Record<string, string[]>,
): Omit<DiagnosticResult, 'id' | 'completedAt'> {
  const subscales = computeSubscales(selectedByStation)
  const tendencies = aggregateTendencies(subscales)
  const { zonesSupport, zonesMiddle, zonesRisk } = computeZones(tendencies)
  const riskSignal = hasRiskSignal(subscales)
  const interpretation = buildInterpretation(
    zonesSupport,
    zonesMiddle,
    zonesRisk,
    riskSignal,
  )
  return {
    userId,
    subscales,
    tendencies,
    zonesSupport,
    zonesMiddle,
    zonesRisk,
    riskSignal,
    interpretation,
  }
}

export const TENDENCY_LABELS: Record<TendencyId, string> = {
  communication: 'Коммуникация',
  analysis: 'Анализ',
  practical: 'Практика',
  creation: 'Креативность',
  resilience: 'Устойчивость',
  organization: 'Организация',
}
