import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readyTelegram } from './lib/telegram'
import { AppLayout } from './components/AppLayout'
import { AuthPage } from './routes/AuthPage'
import { StartPage } from './routes/StartPage'
import { ProfilePage } from './routes/ProfilePage'
import { LinkParentPage } from './routes/LinkParentPage'
import { ProfessionsPage } from './routes/ProfessionsPage'
import { DiagnosticPage } from './routes/DiagnosticPage'
import { ParentCabinetPage } from './routes/ParentCabinetPage'
import { ParentChildPage } from './routes/ParentChildPage'

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<AppLayout />}>
        {/* Child area */}
        <Route path="child" element={<ProfilePage />} />
        <Route path="child/link-parent" element={<LinkParentPage />} />
        <Route path="child/professions" element={<ProfessionsPage />} />
        <Route path="child/diagnostic" element={<DiagnosticPage />} />

        {/* Parent area */}
        <Route path="parent" element={<ParentCabinetPage />} />
        <Route path="parent/children" element={<ParentCabinetPage />} />
        <Route path="parent/child/:childId" element={<ParentChildPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function AppFull() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
