import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { isTelegram, getInitData } from '../lib/telegram'
import { getStoredTelegramToken, getStoredTelegramUser } from '../lib/storage'
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

  useEffect(() => {
    if (!isTelegram() || !getInitData()) {
      setTelegramLoading(false)
      return
    }
    const token = getStoredTelegramToken()
    const storedUser = getStoredTelegramUser()
    if (token && storedUser) {
      setUser(storedUser, token)
      setTelegramLoading(false)
      navigate('/profile', { replace: true })
      return
    }
    const BASE = import.meta.env.VITE_API_URL ?? ''
    if (!BASE) {
      setTelegramError('Не настроен сервер. Используйте приложение в браузере.')
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newUser = {
      id: user?.id ?? crypto.randomUUID(),
      name: name.trim(),
      age: age ? Number(age) : undefined,
    }

    setUser(newUser)
    navigate('/profile')
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
