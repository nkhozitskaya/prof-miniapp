import { useState } from 'react'
import {
  getSessionToken,
  getSessionUser,
  setSessionToken,
  setSessionUser,
  clearSession,
} from '../lib/storage'
import type { User } from '../types'

export function getStoredUser(): User | null {
  const t = getSessionToken()
  const u = getSessionUser()
  if (t && u) {
    return {
      id: u.id,
      name: u.name,
      age: u.age,
      phone: u.phone,
    }
  }
  return null
}

export function useUser() {
  const [user, setUserState] = useState<User | null>(() => getStoredUser())

  const setUser = (u: User | null, token?: string) => {
    setUserState(u)
    if (u && token) {
      setSessionToken(token)
      setSessionUser({
        id: u.id,
        name: u.name,
        age: u.age,
        phone: u.phone,
      })
    } else {
      clearSession()
    }
  }

  return { user, setUser }
}
