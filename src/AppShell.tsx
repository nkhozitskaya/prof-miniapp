import { useState, useEffect, Suspense, type ComponentType } from 'react'

export function AppShell() {
  const [App, setApp] = useState<ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    import('./AppFull')
      .then((m) => setApp(() => m.default))
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="text-center space-y-2 max-w-sm">
          <p className="text-red-300">{error}</p>
          <p className="text-sm text-slate-400">Закройте и откройте приложение снова из бота.</p>
        </div>
      </div>
    )
  }

  if (!App) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <p className="text-slate-300">Загрузка приложения...</p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
          <p className="text-slate-300">Загрузка...</p>
        </div>
      }
    >
      <App />
    </Suspense>
  )
}
