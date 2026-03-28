export type User = {
  id: string
  name: string
  age?: number
  /** E.164, из БД (вход по телефону или привязка позже) */
  phone?: string
}

/** Подшкалы (12) — сырые баллы после выбора вариантов */
export type SubscaleId =
  | 'comm_breadth'
  | 'comm_depth'
  | 'research_depth'
  | 'analysis_breadth'
  | 'practical_objects'
  | 'practical_space'
  | 'creation_expression'
  | 'aesthetic_sensitivity'
  | 'resilience_physical'
  | 'resilience_emotional'
  | 'org_planning'
  | 'org_money_data'

/** 6 склонностей после агрегирования */
export type TendencyId =
  | 'communication'
  | 'analysis'
  | 'practical'
  | 'creation'
  | 'resilience'
  | 'organization'

export type DiagnosticResult = {
  id: string
  userId: string
  completedAt: string
  /** Баллы по 12 подшкалам */
  subscales: Record<SubscaleId, number>
  /** 6 склонностей (0..N, для отображения) */
  tendencies: Record<TendencyId, number>
  /** Опорные (2–3 самых высоких) */
  zonesSupport: TendencyId[]
  /** Подключаемые (средние) */
  zonesMiddle: TendencyId[]
  /** Риск-зона (1–2 самых низких) */
  zonesRisk: TendencyId[]
  /** true если любая подшкала ≤ 0 */
  riskSignal: boolean
  /** Краткая текстовая интерпретация */
  interpretation: string
}

/** Старый формат (до 11 станций) — для отображения в ЛК */
export type LegacyDiagnosticResult = {
  id: string
  userId: string
  completedAt: string
  scores: Record<string, number>
}
