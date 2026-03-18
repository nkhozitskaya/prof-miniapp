import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useDiagnosticResults } from '../hooks/useDiagnosticResults'
import { getStoredTelegramToken } from '../lib/storage'
import { childListParents, createPurchaseRequest, trackProfessionTrial } from '../lib/api'
import {
  PROFESSIONS_BY_TENDENCY,
  TENDENCY_LABELS,
  type ProfessionItem,
} from '../data/professionsByTendency'
import type { DiagnosticResult, TendencyId } from '../types'

function hasZonesSupport(r: unknown): r is DiagnosticResult {
  return typeof r === 'object' && r != null && 'zonesSupport' in r && Array.isArray((r as DiagnosticResult).zonesSupport)
}

export const ProfessionsPage = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const { results } = useDiagnosticResults(user?.id ?? null)
  const token = getStoredTelegramToken()
  const [requesting, setRequesting] = useState<string | null>(null)

  if (!user) {
    navigate('/auth', { replace: true })
    return null
  }

  const latestResult = results.length > 0 && hasZonesSupport(results[0]) ? results[0] : null
  const supportZones = latestResult?.zonesSupport ?? []

  const sections = (Object.keys(PROFESSIONS_BY_TENDENCY) as TendencyId[]).map((tendency) => ({
    tendency,
    label: TENDENCY_LABELS[tendency],
    professions: PROFESSIONS_BY_TENDENCY[tendency],
    isFromResult: supportZones.includes(tendency),
  }))

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Профессии для примерки</h1>
        <p className="text-sm text-slate-300 mt-1">
          Посмотри профессии по типам. Если проходил диагностику — в начале блоки по твоим сильным сторонам.
        </p>
      </header>

      <div className="space-y-6">
        {sections.map(({ tendency, label, professions, isFromResult }) => (
          <section key={tendency} className="space-y-2">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <span className={isFromResult ? 'text-emerald-400' : 'text-slate-400'}>
                {label}
              </span>
              {isFromResult && (
                <span className="text-xs text-emerald-400/80">(по результатам)</span>
              )}
            </h2>
            <ul className="space-y-2">
              {professions.map((p: ProfessionItem) => (
                <li key={p.id}>
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-2">
                    <div>
                      <div className="font-medium text-slate-100">{p.title}</div>
                      <div className="text-sm text-slate-400">{p.shortDesc}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 py-2 rounded bg-slate-700 hover:bg-slate-600 font-medium text-sm"
                        onClick={() => {
                          if (!token) return
                          trackProfessionTrial(token, { professionId: p.id, status: 'started' }).catch(() => {})
                        }}
                        disabled={!token}
                      >
                        Начать
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-medium text-sm"
                        onClick={() => {
                          if (!token) return
                          trackProfessionTrial(token, { professionId: p.id, status: 'completed', result: { recommendation: 'Завершено. Рекомендации появятся здесь.' } }).catch(() => {})
                        }}
                        disabled={!token}
                      >
                        Завершить
                      </button>
                    </div>
                    <button
                      type="button"
                      className={`w-full py-2 rounded font-medium text-sm border border-slate-600 ${
                        requesting === p.id ? 'bg-slate-700 text-slate-300 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      disabled={!token || requesting === p.id}
                      onClick={async () => {
                        if (!token) return
                        setRequesting(p.id)
                        try {
                          const parents = await childListParents(token)
                          if (parents.length === 0) {
                            alert('Сначала привяжи родителя в личном кабинете.')
                            return
                          }
                          await createPurchaseRequest(token, parents[0].id, p.id)
                          alert('Запрос отправлен родителю.')
                        } catch {
                          alert('Не удалось отправить запрос. Попробуй позже.')
                        } finally {
                          setRequesting(null)
                        }
                      }}
                    >
                      Запросить покупку у родителя
                    </button>
                    {!token && (
                      <div className="text-xs text-slate-500">Трекинг доступен в Telegram-режиме.</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Пройди диагностику — в личном кабинете появятся результаты, а здесь — подборка профессий по твоим склонностям.
      </p>
    </div>
  )
}
