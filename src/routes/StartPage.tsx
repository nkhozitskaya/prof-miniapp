import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredTelegramToken, setStoredRole, type AppRole } from '../lib/storage'
import { saveUserProfile } from '../lib/api'

export function StartPage() {
  const { user } = useUser()
  const navigate = useNavigate()

  const pick = (role: AppRole) => {
    setStoredRole(role)
    const token = getStoredTelegramToken()
    if (token) {
      saveUserProfile(token, { role }).catch(() => {})
    }
    if (!user) {
      navigate('/auth', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Профориентация</h1>
          <p className="text-sm text-slate-300">Кто вы?</p>
        </header>

        <button
          type="button"
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-medium transition-colors"
          onClick={() => pick('teen')}
        >
          Я подросток
        </button>

        <button
          type="button"
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-medium transition-colors"
          onClick={() => pick('parent')}
        >
          Я родитель
        </button>

        <p className="text-xs text-slate-500 text-center">
          Роль можно будет сменить позже в кабинете.
        </p>
      </div>
    </div>
  )
}

