/** Единая сессия API: JWT + пользователь (Telegram Mini App и браузер по телефону). */

import { isJwtExpired } from './jwtExpiry'

const SESSION_TOKEN_KEY = 'prof_app_session_token'
const SESSION_USER_KEY = 'prof_app_session_user'

const LEGACY_TELEGRAM_TOKEN = 'prof_app_telegram_token'
const LEGACY_TELEGRAM_USER = 'prof_app_telegram_user'

function migrateLegacyTelegramKeys(): void {
  const t = localStorage.getItem(LEGACY_TELEGRAM_TOKEN)
  const u = localStorage.getItem(LEGACY_TELEGRAM_USER)
  if (t && u && !localStorage.getItem(SESSION_TOKEN_KEY)) {
    localStorage.setItem(SESSION_TOKEN_KEY, t)
    localStorage.setItem(SESSION_USER_KEY, u)
  }
  if (t) localStorage.removeItem(LEGACY_TELEGRAM_TOKEN)
  if (u) localStorage.removeItem(LEGACY_TELEGRAM_USER)
}

export function getSessionToken(): string | null {
  migrateLegacyTelegramKeys()
  const t = localStorage.getItem(SESSION_TOKEN_KEY)
  if (t && isJwtExpired(t)) {
    clearSession()
    return null
  }
  return t
}

export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token)
}

export function getSessionUser(): { id: string; name: string; age?: number; phone?: string } | null {
  migrateLegacyTelegramKeys()
  const raw = localStorage.getItem(SESSION_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; name: string; age?: number; phone?: string }
  } catch {
    return null
  }
}

export function setSessionUser(user: { id: string; name: string; age?: number; phone?: string }): void {
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY)
  localStorage.removeItem(SESSION_USER_KEY)
  localStorage.removeItem(LEGACY_TELEGRAM_TOKEN)
  localStorage.removeItem(LEGACY_TELEGRAM_USER)
  localStorage.removeItem('prof_app_user')
  localStorage.removeItem('prof_app_diagnostic_results')
}
