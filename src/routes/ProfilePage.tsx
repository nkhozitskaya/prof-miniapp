import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useDiagnosticResults } from '../hooks/useDiagnosticResults'
import { getStoredTelegramToken, clearStoredRole, setStoredTelegramUser } from '../lib/storage'
import { getUserProfile, saveUserProfile } from '../lib/api'
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
  const token = useMemo(() => getStoredTelegramToken(), [])
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profileAge, setProfileAge] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileEmail, setProfileEmail] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user) return
    setProfileName(user.name ?? '')
    setProfileAge(user.age != null ? String(user.age) : '')
  }, [user])

  useEffect(() => {
    if (!token || !user) return
    getUserProfile(token)
      .then((p) => {
        if (!p) return
        const merged = {
          ...user,
          name: p.display_name ?? user.name,
          age: p.age ?? user.age,
          phone: p.phone ?? user.phone,
          email: p.email ?? user.email,
          role: p.role ?? user.role,
        }
        setUser(merged, token)
        setStoredTelegramUser(merged)
        setProfileName(merged.name)
        setProfileAge(merged.age != null ? String(merged.age) : '')
        setProfilePhone(merged.phone ?? '')
        setProfileEmail(merged.email ?? '')
      })
      .catch(() => {})
  }, [token, user?.id])

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
          </div>
          <button
            type="button"
            className="text-sm text-red-300 hover:text-red-200 underline"
            onClick={() => {
              clearStoredRole()
              setUser(null)
              navigate('/', { replace: true })
            }}
          >
            Выйти
          </button>
        </header>

        <button
          type="button"
          className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 font-medium transition-colors border border-slate-700"
          onClick={() => {
            clearStoredRole()
            navigate('/', { replace: true })
          }}
        >
          Сменить роль
        </button>

        <section className="bg-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-lg font-semibold">Мои данные</h2>
          <input
            className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Имя"
          />
          <input
            type="number"
            min={10}
            max={99}
            className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
            value={profileAge}
            onChange={(e) => setProfileAge(e.target.value)}
            placeholder="Возраст"
          />
          <input
            className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
            value={profilePhone}
            onChange={(e) => setProfilePhone(e.target.value)}
            placeholder="Телефон (необязательно)"
          />
          <input
            type="email"
            className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            placeholder="Email (необязательно)"
          />
          <button
            type="button"
            disabled={profileSaving}
            className={`w-full py-2 rounded font-medium transition-colors ${
              profileSaving ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            onClick={async () => {
              const updated = {
                ...user,
                name: profileName.trim() || user.name,
                age: profileAge ? Number(profileAge) : undefined,
                phone: profilePhone.trim() || undefined,
                email: profileEmail.trim() || undefined,
              }
              setUser(updated, token ?? undefined)
              if (!token) {
                setProfileMsg('Сохранено локально.')
                return
              }
              setProfileSaving(true)
              setProfileMsg(null)
              try {
                const p = await saveUserProfile(token, {
                  displayName: updated.name,
                  age: updated.age ?? null,
                  phone: updated.phone ?? '',
                  email: updated.email ?? '',
                  role: 'teen',
                })
                const merged = {
                  ...updated,
                  name: p.display_name ?? updated.name,
                  age: p.age ?? updated.age,
                  phone: p.phone ?? updated.phone,
                  email: p.email ?? updated.email,
                  role: p.role ?? 'teen',
                }
                setUser(merged, token)
                setStoredTelegramUser(merged)
                setProfileMsg('Данные сохранены в аккаунте.')
              } catch (e) {
                setProfileMsg(e instanceof Error ? e.message : 'Ошибка сохранения')
              } finally {
                setProfileSaving(false)
              }
            }}
          >
            {profileSaving ? 'Сохраняю...' : 'Сохранить данные'}
          </button>
          {profileMsg && <p className="text-xs text-slate-300">{profileMsg}</p>}
        </section>

        <button
          type="button"
          className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-medium transition-colors"
          onClick={() => navigate('/child/diagnostic')}
        >
          {results.length > 0 ? 'Пройти диагностику заново' : 'Пройти диагностику'}
        </button>
        {results.length > 0 && (
          <p className="text-xs text-slate-400 text-center">
            Результат обновится, предыдущий не сохраняется.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="py-2 rounded bg-slate-800 hover:bg-slate-700 font-medium transition-colors border border-slate-700"
            onClick={() => navigate('/child/professions')}
          >
            Профессии
          </button>
          <button
            type="button"
            className="py-2 rounded bg-slate-800 hover:bg-slate-700 font-medium transition-colors border border-slate-700"
            onClick={() => navigate('/child/link-parent')}
          >
            Привязать родителя
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 font-medium transition-colors border border-slate-700"
          onClick={() => navigate('/parent')}
        >
          Родительский кабинет
        </button>

        <section className="bg-slate-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Результат диагностики</h2>
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
