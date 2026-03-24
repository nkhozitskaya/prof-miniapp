import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const navHeight = 56

function IconParent() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4h-1" />
      <path d="M4 21v-2a4 4 0 0 1 4-4h1" />
      <circle cx="7" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <path d="M12 10v4" />
      <path d="M10 14h4" />
    </svg>
  )
}

function IconProfessions() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  )
}

function IconDiagnostic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const isParentMode = path.startsWith('/parent')

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col" style={{ paddingBottom: navHeight }}>
      <main className="flex-1 max-w-xl mx-auto w-full">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 safe-area-pb"
        style={{ height: navHeight }}
        aria-label="Меню"
      >
        <div className="max-w-xl mx-auto h-full flex items-stretch">
          {!isParentMode ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/child')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  path === '/child' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Личный кабинет"
              >
                <IconCabinet />
              </button>
              <button
                type="button"
                onClick={() => navigate('/child/professions')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  path === '/child/professions' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Профессии"
              >
                <IconProfessions />
              </button>
              <button
                type="button"
                onClick={() => navigate('/child/diagnostic')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  path === '/child/diagnostic' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Диагностика"
              >
                <IconDiagnostic />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/parent/diagnostic')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  path === '/parent/diagnostic' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Диагностика родителя"
              >
                <IconParent />
              </button>
              <button
                type="button"
                onClick={() => navigate('/parent/children')}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  path.startsWith('/parent/child') || path === '/parent/children'
                    ? 'text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label="Дети"
              >
                <IconCabinet />
              </button>
              <button
                type="button"
                onClick={() => navigate('/child')}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors text-slate-400 hover:text-slate-200"
                aria-label="Вернуться в детский кабинет"
              >
                <IconCabinet />
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
