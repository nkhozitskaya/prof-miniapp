import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { getStoredRole, setStoredRole, type AppRole } from '../lib/storage'

export function StartPage() {
  const { user } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    // Если роль уже выбрана — сразу ведём в соответствующий кабинет
    const role = getStoredRole()
    if (!role) return
    if (!user) {
      navigate('/auth', { replace: true })
      return
    }
    navigate(role === 'parent' ? '/parent' : '/child', { replace: true })
  }, [navigate, user])

  const pick = (role: AppRole) => {
    setStoredRole(role)
    if (!user) {
      navigate('/auth', { replace: true })
    } else {
      navigate(role === 'parent' ? '/parent' : '/child', { replace: true })
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

