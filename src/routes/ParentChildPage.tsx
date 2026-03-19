import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredTelegramToken } from '../lib/storage'
import { parentGetChildDashboard } from '../lib/api'
import { TENDENCY_LABELS } from '../utils/diagnosticScore'

function childName(child: any): string {
  const name = [child?.first_name, child?.last_name].filter(Boolean).join(' ')
  return name || child?.username || 'Ребёнок'
}

export function ParentChildPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const params = useParams()
  const childId = params.childId ?? ''
  const token = useMemo(() => getStoredTelegramToken(), [])

  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    if (!token) {
      navigate('/child', { replace: true })
      return
    }
    if (!childId) {
      navigate('/parent', { replace: true })
      return
    }
    setLoading(true)
    setError(null)
    parentGetChildDashboard(token, childId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [childId, navigate, token, user])

  if (!user) return null

  const child = data?.child
  const diag = data?.child_diagnostic
  const trials = data?.profession_trials ?? []

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{child ? childName(child) : 'Ребёнок'}</h1>
            <p className="text-xs text-slate-400">Родительский просмотр</p>
          </div>
          <button
            type="button"
            className="text-sm text-slate-300 hover:text-white underline"
            onClick={() => navigate('/parent')}
          >
            К списку
          </button>
        </header>

        {loading && <p className="text-sm text-slate-400">Загрузка...</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}

        {!loading && !error && (
          <>
            <section className="bg-slate-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-2">Диагностика ребёнка</h2>
              {!diag && <p className="text-sm text-slate-300">Ребёнок ещё не проходил диагностику.</p>}
              {diag && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">{new Date(diag.completed_at).toLocaleString('ru-RU')}</div>
                  {diag.zones_support?.length > 0 && (
                    <div className="text-sm">
                      <span className="text-emerald-400 font-medium">Опорные:</span>{' '}
                      {diag.zones_support.map((t: keyof typeof TENDENCY_LABELS) => TENDENCY_LABELS[t]).join(', ')}
                    </div>
                  )}
                  {diag.zones_risk?.length > 0 && (
                    <div className="text-sm text-amber-200/90">
                      <span className="font-medium">Зоны внимания:</span>{' '}
                      {diag.zones_risk.map((t: keyof typeof TENDENCY_LABELS) => TENDENCY_LABELS[t]).join(', ')}
                    </div>
                  )}
                  {diag.interpretation && (
                    <p className="text-sm text-slate-300 border-t border-slate-700 pt-2">{diag.interpretation}</p>
                  )}
                </div>
              )}
            </section>

            <section className="bg-slate-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-2">Примерки профессий</h2>
              {trials.length === 0 ? (
                <p className="text-sm text-slate-300">Пока нет активности.</p>
              ) : (
                <ul className="space-y-2">
                  {trials.map((t: any) => (
                    <li key={t.id} className="rounded-xl border border-slate-700 bg-slate-900/20 p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{t.profession_id}</div>
                        <div className="text-xs text-slate-400">{t.status}</div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(t.started_at).toLocaleDateString('ru-RU')}
                        {t.completed_at ? ` → ${new Date(t.completed_at).toLocaleDateString('ru-RU')}` : ''}
                      </div>
                      {t.result?.recommendation && <div className="text-sm text-slate-300 mt-2">{t.result.recommendation}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

