import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
          <div className="text-center space-y-3 max-w-sm">
            <h1 className="text-lg font-semibold">Что-то пошло не так</h1>
            <p className="text-sm text-slate-400">
              Закройте приложение и откройте снова из бота.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
