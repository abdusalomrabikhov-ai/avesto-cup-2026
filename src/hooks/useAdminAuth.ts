// Авторизация админки — пароль проверяется на сервере (POST /api/login), не в клиентском JS.
// При успехе сам пароль кладётся в sessionStorage со сроком жизни — используется дальше
// как Bearer-токен для PUT /api/data (см. src/data/store.ts)
import { useState } from 'react'

const KEY = 'avesto-admin-auth'
const API_URL = import.meta.env.VITE_API_URL ?? ''

// sessionStorage умирает с вкладкой, но вкладка может жить неделями — ограничиваем
// сессию рабочим днём турнира, чтобы украденный пароль не работал вечно
const TTL_MS = 8 * 60 * 60 * 1000

// Возвращает пароль или null, если сессии нет / истекла. Экспортируется,
// чтобы store.ts не парсил формат хранения сам
export function readAuth(): string | null {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    const { password, expires } = JSON.parse(raw)
    if (typeof password !== 'string' || typeof expires !== 'number' || Date.now() > expires) {
      sessionStorage.removeItem(KEY)
      return null
    }
    return password
  } catch {
    // Запись в старом формате (просто строка) — сбрасываем, заставляем перелогиниться
    sessionStorage.removeItem(KEY)
    return null
  }
}

export function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState(() => readAuth() !== null)

  const login = async (password: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      sessionStorage.setItem(KEY, JSON.stringify({ password, expires: Date.now() + TTL_MS }))
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
