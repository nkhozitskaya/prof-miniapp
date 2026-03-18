import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredTelegramToken } from '../lib/storage'
import { childAcceptLink } from '../lib/api'

export function LinkParentPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const token = useMemo(() => getStoredTelegramToken(), [])
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    navigate('/auth', { replace: true })
    return null
  }
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center space-y-2 max-w-sm">
          <p className="text-slate-300">Привязка доступна только в Telegram-режиме.</p>
          <button
            type="button"
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 font-medium"
            onClick={() => navigate('/child')}
          >
            В личный кабинет
          </button>
        </div>
      </div>
    )
  }

  const submit = async () => {
    const v = code.trim()
    if (!v) return
    setLoading(true)
    setError(null)
    try {
      await childAcceptLink(token, v)
      navigate('/child', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось привязать')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <header>
          <h1 className="text-xl font-semibold">Привязать родителя</h1>
          <p className="text-sm text-slate-300 mt-1">Введи код, который родитель создал у себя в кабинете.</p>
        </header>

        <div className="bg-slate-800 rounded-xl p-4 space-y-3">
          <input
            className="w-full px-3 py-3 rounded bg-slate-700 border border-slate-600 outline-none focus:border-emerald-500 tracking-widest text-center text-lg"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="КОД"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
          />
          {error && <div className="text-sm text-red-300">{error}</div>}
          <button
            type="button"
            className={`w-full py-2 rounded font-medium transition-colors ${
              loading ? 'bg-slate-600 text-slate-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Привязываю...' : 'Привязать'}
          </button>
          <button
            type="button"
            className="w-full py-2 rounded bg-slate-700 hover:bg-slate-600 font-medium"
            onClick={() => navigate('/child')}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

