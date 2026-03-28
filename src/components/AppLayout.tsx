import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const navHeight = 72

function IconProfessions() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  )
}

function IconDiagnostic() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  )
}

function IconCabinet() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  return (
    <div
      className="min-h-screen bg-slate-900 text-white flex flex-col"
      style={{ paddingBottom: `calc(${navHeight}px + env(safe-area-inset-bottom, 0px))` }}
    >
      <main className="flex-1 max-w-xl mx-auto w-full">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 pb-[env(safe-area-inset-bottom)]"
        style={{ minHeight: navHeight }}
        aria-label="Меню"
      >
        <div className="max-w-xl mx-auto min-h-[72px] flex items-stretch">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={`flex-1 min-h-[72px] flex flex-col items-center justify-center gap-1 active:opacity-90 transition-colors ${
              path === '/profile' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Личный кабинет"
          >
            <IconCabinet />
          </button>
          <button
            type="button"
            onClick={() => navigate('/professions')}
            className={`flex-1 min-h-[72px] flex flex-col items-center justify-center gap-1 active:opacity-90 transition-colors ${
              path === '/professions' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Профессии"
          >
            <IconProfessions />
          </button>
          <button
            type="button"
            onClick={() => navigate('/diagnostic')}
            className={`flex-1 min-h-[72px] flex flex-col items-center justify-center gap-1 active:opacity-90 transition-colors ${
              path === '/diagnostic' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Диагностика"
          >
            <IconDiagnostic />
          </button>
        </div>
      </nav>
    </div>
  )
}
