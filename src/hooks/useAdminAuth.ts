// Авторизация админки — пароль проверяется на сервере (POST /api/login), не в клиентском JS.
// При успехе сам пароль кладётся в sessionStorage — используется дальше как Bearer-токен
// для PUT /api/data (см. src/data/store.ts)
import { useState } from 'react'

const KEY = 'avesto-admin-auth'
const API_URL = import.meta.env.VITE_API_URL ?? ''

export function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState(() => sessionStorage.getItem(KEY) !== null)

  const login = async (password: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      sessionStorage.setItem(KEY, password)
      setIsAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem(KEY)
    setIsAuthed(false)
  }

  return { isAuthed, login, logout }
}
