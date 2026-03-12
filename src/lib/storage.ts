/** Ключи и хранение для режима Telegram (токен + пользователь с бэкенда) */

const TELEGRAM_TOKEN_KEY = 'prof_app_telegram_token'
const TELEGRAM_USER_KEY = 'prof_app_telegram_user'

export function getStoredTelegramToken(): string | null {
  return localStorage.getItem(TELEGRAM_TOKEN_KEY)
}

export function setStoredTelegramToken(token: string): void {
  localStorage.setItem(TELEGRAM_TOKEN_KEY, token)
}

export function clearStoredTelegram(): void {
  localStorage.removeItem(TELEGRAM_TOKEN_KEY)
  localStorage.removeItem(TELEGRAM_USER_KEY)
}

export function getStoredTelegramUser(): { id: string; name: string; age?: number } | null {
  const raw = localStorage.getItem(TELEGRAM_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; name: string; age?: number }
  } catch {
    return null
  }
}

export function setStoredTelegramUser(user: { id: string; name: string; age?: number }): void {
  localStorage.setItem(TELEGRAM_USER_KEY, JSON.stringify(user))
}
