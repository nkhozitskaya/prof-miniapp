import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readyTelegram } from './lib/telegram'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import { AuthPage } from './routes/AuthPage'
import { ProfilePage } from './routes/ProfilePage'
import { DiagnosticPage } from './routes/DiagnosticPage'

const queryClient = new QueryClient()

function AppInit() {
  useEffect(() => {
    const t = setTimeout(() => {
      readyTelegram()
    }, 100)
    return () => clearTimeout(t)
  }, [])
  return null
}

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/diagnostic" element={<DiagnosticPage />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppInit />
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
