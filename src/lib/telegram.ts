/** Типы для Telegram Web App (частично) */
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        ready: () => void
        expand: () => void
        close: () => void
        requestContact?: (callback?: (sent: boolean) => void) => void
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
  return Boolean(window.Telegram?.WebApp)
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

/** Запросить у пользователя подтверждение передачи телефона в Telegram. */
export async function requestTelegramContact(): Promise<boolean> {
  const twa = getWebApp()
  if (!twa?.requestContact) return false
  return new Promise((resolve) => {
    try {
      twa.requestContact?.((sent) => resolve(Boolean(sent)))
    } catch {
      resolve(false)
    }
  })
}
