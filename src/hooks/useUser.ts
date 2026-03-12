import { useState } from 'react'
import { isTelegram } from '../lib/telegram'
import {
  getStoredTelegramToken,
  getStoredTelegramUser,
  setStoredTelegramToken,
  setStoredTelegramUser,
  clearStoredTelegram,
} from '../lib/storage'
import type { User } from '../types'

const USER_KEY = 'prof_app_user'

export function getStoredUser(): User | null {
  if (isTelegram()) {
    const u = getStoredTelegramUser()
    if (u && getStoredTelegramToken()) return u
    return null
  }
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function useUser() {
  const [user, setUserState] = useState<User | null>(() => getStoredUser())

  const setUser = (u: User | null, telegramToken?: string) => {
    setUserState(u)
    if (isTelegram()) {
      if (u && telegramToken) {
        setStoredTelegramToken(telegramToken)
        setStoredTelegramUser(u)
      } else {
        clearStoredTelegram()
      }
    } else {
      if (u) {
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      } else {
        localStorage.removeItem(USER_KEY)
      }
    }
  }

  return { user, setUser }
}
