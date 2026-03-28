import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useDiagnosticResults } from '../hooks/useDiagnosticResults'
import { TENDENCY_LABELS } from '../utils/diagnosticScore'
import type { DiagnosticResult, LegacyDiagnosticResult, TendencyId } from '../types'

function isNewFormat(
  r: DiagnosticResult | LegacyDiagnosticResult,
): r is DiagnosticResult {
  return 'tendencies' in r && r.interpretation != null
}

function ResultCardNew({ r }: { r: DiagnosticResult }) {
  const maxTendency = Math.max(...Object.values(r.tendencies), 0.01)
  return (
    <div className="border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="text-xs text-slate-400">
        {new Date(r.completedAt).toLocaleString('ru-RU')}
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-medium text-slate-300">6 склонностей</div>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(r.tendencies) as [TendencyId, number][]).map(
            ([id, value]) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <div className="w-20 truncate text-slate-300">
                  {TENDENCY_LABELS[id]}
                </div>
                <div className="flex-1 h-2 bg-slate-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded"
                    style={{
                      width: `${Math.round((value / maxTendency) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-slate-400">{value.toFixed(1)}</span>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="text-sm">
        <span className="text-emerald-400 font-medium">Опорные:</span>{' '}
        {r.zonesSupport.map((t) => TENDENCY_LABELS[t]).join(', ')}
      </div>
      {r.zonesMiddle.length > 0 && (
        <div className="text-sm text-slate-300">
          <span className="font-medium">Подключаемые:</span>{' '}
          {r.zonesMiddle.map((t) => TENDENCY_LABELS[t]).join(', ')}
        </div>
      )}
      <div className="text-sm text-amber-200/90">
        <span className="font-medium">Зоны внимания:</span>{' '}
        {r.zonesRisk.map((t) => TENDENCY_LABELS[t]).join(', ')}
      </div>
      {r.riskSignal && (
        <div className="text-xs text-amber-400 bg-amber-500/10 rounded px-2 py-1">
          Есть риск-сигнал по одной из подшкал
        </div>
      )}
      <p className="text-sm text-slate-300 border-t border-slate-700 pt-2 mt-2">
        {r.interpretation}
      </p>
    </div>
  )
}

function ResultCardLegacy({ r }: { r: LegacyDiagnosticResult }) {
  return (
    <div className="border border-slate-700 rounded-xl p-4">
      <div className="text-xs text-slate-400">
        {new Date(r.completedAt).toLocaleString('ru-RU')}
      </div>
      <div className="mt-1 text-sm text-slate-400">Результат (старый формат)</div>
      <div className="mt-1 space-y-0.5 text-sm">
        {Object.entries(r.scores).map(([scale, value]) => (
          <div key={scale}>
            <span className="text-slate-300">{scale}:</span> {value}
          </div>
        ))}
      </div>
    </div>
  )
}

export const ProfilePage = () => {
  const { user, setUser } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
    }
  }, [user, navigate])

  if (!user) return null

  const { results, loading } = useDiagnosticResults(user.id)

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Личный кабинет</h1>
            <p className="text-sm text-slate-300">
              {user.name}
              {user.age != null ? `, ${user.age} лет` : ''}
            </p>
            {user.phone && (
              <p className="text-xs text-slate-500 mt-1">{user.phone}</p>
            )}
          </div>
          <button
            type="button"
            className="text-sm text-red-300 hover:text-red-200 underline"
            onClick={() => {
              setUser(null)
              navigate('/auth')
            }}
          >
            Выйти
          </button>
        </header>

        <button
          type="button"
          className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-medium transition-colors"
          onClick={() => navigate('/diagnostic')}
        >
          Пройти диагностику
        </button>

        <section className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Результаты диагностики</h2>
          {loading && (
            <p className="text-sm text-slate-400">Загрузка...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="text-sm text-slate-300">
              Пока нет результатов. Пройдите диагностику (11 станций).
            </p>
          )}
          {!loading && results.length > 0 && (
            <ul className="space-y-3">
              {results.map((r) => (
                <li key={r.id}>
                  {isNewFormat(r) ? (
                    <ResultCardNew r={r} />
                  ) : (
                    <ResultCardLegacy r={r} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
