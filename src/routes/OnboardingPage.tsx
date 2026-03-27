import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredRole, getStoredTelegramToken, setStoredTelegramUser } from '../lib/storage'
import { getUserProfile, saveUserProfile } from '../lib/api'
import { isTelegram, requestTelegramContact } from '../lib/telegram'

export function OnboardingPage() {
  const { user, setUser } = useUser()
  const navigate = useNavigate()
  const token = useMemo(() => getStoredTelegramToken(), [])
  const role = getStoredRole()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contactConfirming, setContactConfirming] = useState(false)
  const [contactConfirmed, setContactConfirmed] = useState(false)
  const [telegramMode, setTelegramMode] = useState(Boolean(token) || isTelegram())
  const [step, setStep] = useState<'phone' | 'profile'>('phone')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token && !telegramMode) {
      setTelegramMode(true)
      return
    }
    if (telegramMode) return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 40
    const tick = () => {
      if (cancelled) return
      if (isTelegram()) {
        setTelegramMode(true)
        return
      }
      attempts += 1
      if (attempts < maxAttempts) {
        setTimeout(tick, 150)
      }
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [telegramMode])

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
        setEmail(merged.email ?? '')
        if (p.phone && p.phone.trim()) setContactConfirmed(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [navigate, role, token, user?.id])

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">
            {step === 'phone' ? 'Подтверди телефон' : 'Данные профиля'}
          </h1>
          <p className="text-sm text-slate-300">
            {step === 'phone'
              ? 'Шаг 2 из 4: подтверждение телефона.'
              : 'Шаг 3 из 4: имя, возраст и email.'}
          </p>
        </header>

        {loading ? (
          <div className="text-center text-slate-400">Загрузка...</div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            {step === 'phone' ? (
              <>
                {telegramMode ? (
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
                        setError('Не удалось подтвердить номер в Telegram. Нажми кнопку снова.')
                      }
                    }}
                  >
                    {contactConfirming ? 'Запрашиваю...' : contactConfirmed ? 'Телефон подтверждён' : 'Поделиться номером через Telegram'}
                  </button>
                ) : (
                  <div className="text-sm text-slate-300 rounded bg-slate-700/50 border border-slate-600 p-3">
                    Подтверждение номера доступно только внутри Telegram Mini App.
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  В Telegram телефон подтверждается только через кнопку и согласие пользователя.
                </p>
                <button
                  type="button"
                  className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-medium transition-colors"
                  onClick={() => {
                    if (!telegramMode) {
                      setError('Открой Mini App внутри Telegram и подтверди номер кнопкой.')
                      return
                    }
                    if (!contactConfirmed) {
                      setError('Сначала подтверди номер через кнопку Telegram.')
                      return
                    }
                    setStep('profile')
                  }}
                >
                  Продолжить
                </button>
              </>
            ) : (
              <>
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
              </>
            )}

            {error && <div className="text-sm text-red-300">{error}</div>}

            {step === 'profile' && (
              <button
                type="button"
                disabled={saving}
                className={`w-full py-2 rounded font-medium transition-colors ${
                  saving ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
                onClick={async () => {
                  setError(null)
                  const n = name.trim()
                  const a = age ? Number(age) : NaN
                  if (!n || !Number.isFinite(a)) {
                    setError('Заполни имя и возраст.')
                    return
                  }
                  const merged = {
                    ...user,
                    name: n,
                    age: a,
                    phone: user.phone || 'confirmed_by_telegram',
                    email: email.trim() || undefined,
                    role: role ?? undefined,
                  }
                  setUser(merged, token ?? undefined)
                  if (!token) {
                    navigate(role === 'parent' ? '/parent' : '/child', { replace: true })
                    return
                  }
                  setSaving(true)
                  try {
                    await saveUserProfile(token, {
                      displayName: n,
                      age: a,
                      phone: merged.phone ?? 'confirmed_by_telegram',
                      email: email.trim(),
                      role: role ?? null,
                    })
                    setStoredTelegramUser(merged)
                    navigate(role === 'parent' ? '/parent' : '/child', { replace: true })
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Ошибка сохранения')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? 'Сохраняю...' : 'В личный кабинет'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

