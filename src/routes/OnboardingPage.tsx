import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredRole, getStoredTelegramToken, setStoredTelegramUser } from '../lib/storage'
import { getUserProfile, saveUserProfile } from '../lib/api'
import { isTelegram, requestTelegramContact } from '../lib/telegram'

function hasRequired(profile: { display_name: string | null; age: number | null; phone: string | null } | null): boolean {
  if (!profile) return false
  return Boolean(profile.display_name && profile.display_name.trim() && profile.phone && profile.phone.trim() && profile.age != null)
}

export function OnboardingPage() {
  const { user, setUser } = useUser()
  const navigate = useNavigate()
  const token = useMemo(() => getStoredTelegramToken(), [])
  const role = getStoredRole()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contactConfirming, setContactConfirming] = useState(false)
  const [contactConfirmed, setContactConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!role) {
      navigate('/', { replace: true })
      return
    }
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    setName(user.name ?? '')
    setAge(user.age != null ? String(user.age) : '')
    setPhone(user.phone ?? '')
    setEmail(user.email ?? '')

    if (!token) {
      setLoading(false)
      return
    }

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
        setName(merged.name)
        setAge(merged.age != null ? String(merged.age) : '')
        setPhone(merged.phone ?? '')
        setEmail(merged.email ?? '')

        if (hasRequired(p)) {
          navigate(role === 'parent' ? '/parent/diagnostic' : '/child/diagnostic', { replace: true })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [navigate, role, token, user?.id])

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Заполни профиль</h1>
          <p className="text-sm text-slate-300">
            Шаг 2 из 3: телефон и данные {role === 'parent' ? 'родителя' : 'подростка'}.
          </p>
        </header>

        {loading ? (
          <div className="text-center text-slate-400">Загрузка...</div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            {!isTelegram() && (
              <input
                className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон"
              />
            )}
            {isTelegram() && (
              <button
                type="button"
                disabled={contactConfirming}
                className={`w-full py-2 rounded font-medium transition-colors ${
                  contactConfirming ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600'
                }`}
                onClick={async () => {
                  setError(null)
                  setContactConfirming(true)
                  const ok = await requestTelegramContact()
                  setContactConfirming(false)
                  if (ok) {
                    setContactConfirmed(true)
                  } else {
                    setError('Telegram не передал контакт. Можно ввести телефон вручную.')
                  }
                }}
              >
                {contactConfirming ? 'Запрашиваю...' : contactConfirmed ? 'Телефон подтверждён в Telegram' : 'Поделиться номером через Telegram'}
              </button>
            )}
            <p className="text-xs text-slate-400">
              В Telegram телефон подтверждается только через кнопку и согласие пользователя.
            </p>
            <input
              className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
            />
            <input
              type="number"
              min={10}
              max={99}
              className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Возраст"
            />
            <input
              type="email"
              className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (необязательно)"
            />

            {error && <div className="text-sm text-red-300">{error}</div>}

            <button
              type="button"
              disabled={saving}
              className={`w-full py-2 rounded font-medium transition-colors ${
                saving ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
              onClick={async () => {
                setError(null)
                const n = name.trim()
                const p = phone.trim()
                const a = age ? Number(age) : NaN
                if (!n || !Number.isFinite(a) || (isTelegram() ? !contactConfirmed : !p)) {
                  setError(
                    isTelegram()
                      ? 'Подтверди номер через кнопку Telegram, затем продолжи.'
                      : 'Заполни имя, возраст и телефон.',
                  )
                  return
                }
                const merged = { ...user, name: n, age: a, phone: p || user.phone, email: email.trim() || undefined, role: role ?? undefined }
                setUser(merged, token ?? undefined)
                if (!token) {
                  navigate(role === 'parent' ? '/parent/diagnostic' : '/child/diagnostic', { replace: true })
                  return
                }
                setSaving(true)
                try {
                  await saveUserProfile(token, {
                    displayName: n,
                    age: a,
                    phone: p,
                    email: email.trim(),
                    role: role ?? null,
                  })
                  setStoredTelegramUser(merged)
                  navigate(role === 'parent' ? '/parent/diagnostic' : '/child/diagnostic', { replace: true })
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Ошибка сохранения')
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? 'Сохраняю...' : 'Продолжить'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

