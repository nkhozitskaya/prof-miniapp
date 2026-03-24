import { useNavigate } from 'react-router-dom'

export function ParentDiagnosticPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-5 space-y-3">
        <h1 className="text-xl font-semibold">Взрослая диагностика</h1>
        <p className="text-sm text-slate-300">
          Шаг 3 из 3: базовый вход в родительскую ветку завершён. Далее ты можешь пройти диагностику ребёнка в родительском кабинете.
        </p>
        <button
          type="button"
          className="w-full py-2 rounded bg-emerald-500 hover:bg-emerald-600 font-medium transition-colors"
          onClick={() => navigate('/parent', { replace: true })}
        >
          Перейти в родительский кабинет
        </button>
      </div>
    </div>
  )
}

