import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { isTelegram, getInitData } from '../lib/telegram'
import { getStoredRole, getStoredTelegramToken, getStoredTelegramUser } from '../lib/storage'
import { authTelegram } from '../lib/api'

function apiUserToUser(apiUser: { id: string; first_name: string | null; last_name: string | null; username: string | null }): { id: string; name: string } {
  const name = [apiUser.first_name, apiUser.last_name].filter(Boolean).join(' ') || apiUser.username || 'Пользователь'
  return { id: apiUser.id, name }
}

export const AuthPage = () => {
  const { user, setUser } = useUser()
  const [name, setName] = useState(user?.name ?? '')
  const [age, setAge] = useState(user?.age?.toString() ?? '')
  const [telegramLoading, setTelegramLoading] = useState(isTelegram())
  const [telegramError, setTelegramError] = useState<string | null>(null)
  const navigate = useNavigate()

  const goAfterAuth = () => {
    const role = getStoredRole()
    if (role === 'parent' || role === 'teen') navigate('/onboarding', { replace: true })
    else navigate('/', { replace: true })
  }

  useEffect(() => {
    if (!isTelegram()) {
      setTelegramLoading(false)
      return
    }
    const token = getStoredTelegramToken()
    const storedUser = getStoredTelegramUser()
    if (token && storedUser) {
      setUser(storedUser, token)
      setTelegramLoading(false)
      goAfterAuth()
      return
    }
    const BASE = import.meta.env.VITE_API_URL ?? ''
    if (!BASE) {
      setTelegramError('Не настроен сервер. Используйте приложение в браузере.')
      setTelegramLoading(false)
      return
    }
    let cancelled = false
    let attempts = 0
    const maxAttempts = 25

    const tryAuth = () => {
      if (cancelled) return
      const initData = getInitData()
      if (!initData) {
        attempts += 1
        if (attempts < maxAttempts) {
          setTimeout(tryAuth, 150)
          return
        }
        setTelegramError('Не удалось получить данные Telegram. Закройте и откройте Mini App снова.')
        setTelegramLoading(false)
        return
      }
      authTelegram(initData)
        .then(({ user: apiUser, token }) => {
          if (cancelled) return
          const u = apiUserToUser(apiUser)
          setUser(u, token)
          setTelegramLoading(false)
          goAfterAuth()
        })
        .catch((e) => {
          if (cancelled) return
          setTelegramError(e instanceof Error ? e.message : 'Ошибка входа')
          setTelegramLoading(false)
        })
    }

    const timer = setTimeout(tryAuth, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [navigate, setUser])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newUser = {
      id: user?.id ?? crypto.randomUUID(),
      name: name.trim(),
      age: age ? Number(age) : undefined,
    }

    setUser(newUser)
    goAfterAuth()
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
        <h1 className="text-2xl font-semibold mb-4">Регистрация / вход</h1>
        <form onSubmit={onSubmit} className="space-y-4">
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

          <button
            type="submit"
            className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-medium transition-colors"
          >
            Продолжить
          </button>
        </form>
      </div>
    </div>
  )
}
