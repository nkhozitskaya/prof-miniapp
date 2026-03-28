/** Типы для Telegram Web App (частично) */
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        ready: () => void
        expand: () => void
        close: () => void
        themeParams?: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
      }
    }
  }
}

export function isTelegram(): boolean {
  if (typeof window === 'undefined') return false
  const twa = window.Telegram?.WebApp
  return Boolean(twa?.initData)
}

export function getInitData(): string {
  return window.Telegram?.WebApp?.initData ?? ''
}

export function getWebApp() {
  return window.Telegram?.WebApp
}

/** Подготовить Mini App к показу (развернуть, готово) */
export function readyTelegram() {
  const twa = getWebApp()
  if (twa) {
    twa.ready()
    twa.expand()
  }
}
