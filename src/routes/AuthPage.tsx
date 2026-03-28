import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { isTelegram, getInitData } from '../lib/telegram'
import { getSessionToken, getSessionUser } from '../lib/storage'
import { authTelegram, authPhone, type ApiUser } from '../lib/api'
import { normalizePhoneRu } from '../lib/phone'
import type { User } from '../types'

function apiUserToUser(api: ApiUser): User {
  const name =
    [api.first_name, api.last_name].filter(Boolean).join(' ') ||
    api.username ||
    api.phone ||
    'Пользователь'
  return {
    id: api.id,
    name,
    phone: api.phone ?? undefined,
    age: api.age ?? undefined,
  }
}

export const AuthPage = () => {
  const { user, setUser } = useUser()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState(user?.age?.toString() ?? '')
  const [telegramLoading, setTelegramLoading] = useState(isTelegram())
  const [telegramError, setTelegramError] = useState<string | null>(null)
  const [browserLoading, setBrowserLoading] = useState(false)
  const [browserError, setBrowserError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isTelegram() || !getInitData()) {
      setTelegramLoading(false)
      return
    }
    const token = getSessionToken()
    const storedUser = getSessionUser()
    if (token && storedUser) {
      setUser(
        {
          id: storedUser.id,
          name: storedUser.name,
          age: storedUser.age,
          phone: storedUser.phone,
        },
        token,
      )
      setTelegramLoading(false)
      navigate('/profile', { replace: true })
      return
    }
    const BASE = import.meta.env.VITE_API_URL ?? ''
    if (!BASE) {
      setTelegramError('Не настроен сервер (VITE_API_URL).')
      setTelegramLoading(false)
      return
    }
    const timer = setTimeout(() => {
      authTelegram(getInitData())
        .then(({ user: apiUser, token }) => {
          const u = apiUserToUser(apiUser)
          setUser(u, token)
          setTelegramLoading(false)
          navigate('/profile', { replace: true })
        })
        .catch((e) => {
          setTelegramError(e instanceof Error ? e.message : 'Ошибка входа')
          setTelegramLoading(false)
        })
    }, 200)
    return () => clearTimeout(timer)
  }, [navigate, setUser])

  const onSubmitBrowser = async (e: FormEvent) => {
    e.preventDefault()
    setBrowserError(null)
    const BASE = import.meta.env.VITE_API_URL ?? ''
    if (!BASE) {
      setBrowserError('Не задан VITE_API_URL (URL проекта Supabase).')
      return
    }
    const normalized = normalizePhoneRu(phone)
    if (!normalized) {
      setBrowserError('Введите корректный номер телефона (РФ).')
      return
    }
    if (!name.trim()) {
      setBrowserError('Введите имя.')
      return
    }
    setBrowserLoading(true)
    try {
      const { user: apiUser, token } = await authPhone({
        phone: normalized,
        first_name: name.trim(),
        age: age ? Number(age) : undefined,
      })
      setUser(apiUserToUser(apiUser), token)
      navigate('/profile')
    } catch (err) {
      setBrowserError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setBrowserLoading(false)
    }
  }

  // Браузер: сессия уже в localStorage — сразу в ЛК, форму не показываем
  if (!isTelegram() && user) {
    return <Navigate to="/profile" replace />
  }

  if (isTelegram()) {
    if (telegramLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
          <p className="text-slate-300">Вход через Telegram...</p>
        </div>
      )
    }
    if (telegramError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
          <div className="text-center space-y-2">
            <p className="text-red-300">{telegramError}</p>
            <p className="text-sm text-slate-400">Проверьте интернет или откройте приложение снова из бота.</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-semibold mb-4">Вход по телефону</h1>
        <p className="text-sm text-slate-400 mb-4">
          Данные сохраняются в базе на сервере. Номер — ваш логин для этого приложения.
        </p>
        <form onSubmit={onSubmitBrowser} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Телефон</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 9XX XXX-XX-XX"
              className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Имя</label>
            <input
              className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Возраст (необязательно)</label>
            <input
              type="number"
              min={10}
              max={99}
              className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          {browserError && <p className="text-sm text-red-300">{browserError}</p>}

          <button
            type="submit"
            disabled={browserLoading}
            className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 font-medium transition-colors"
          >
            {browserLoading ? 'Вход…' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  )
}
