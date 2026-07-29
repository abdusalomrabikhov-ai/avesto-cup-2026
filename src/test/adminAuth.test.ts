import { describe, it, expect, beforeEach } from 'vitest'

// Минимальный sessionStorage — тестам readAuth больше ничего из DOM не нужно,
// поэтому не тянем jsdom ради одного стораджа
const store = new Map<string, string>()
;(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage

const { readAuth } = await import('../hooks/useAdminAuth')

const KEY = 'avesto-admin-auth'

describe('readAuth', () => {
  beforeEach(() => store.clear())

  it('возвращает пароль внутри срока жизни', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ password: 'pw', expires: Date.now() + 10_000 }))
    expect(readAuth()).toBe('pw')
  })

  it('возвращает null и чистит хранилище после истечения TTL', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ password: 'pw', expires: Date.now() - 1 }))
    expect(readAuth()).toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('не падает на старом формате (просто строка) и сбрасывает его', () => {
    sessionStorage.setItem(KEY, 'старый-пароль-строкой')
    expect(readAuth()).toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('возвращает null, когда сессии нет', () => {
    expect(readAuth()).toBeNull()
  })
})
