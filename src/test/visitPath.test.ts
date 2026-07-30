import { describe, it, expect } from 'vitest'
import { normalizeVisitPath } from '../lib/visitPath'

describe('normalizeVisitPath', () => {
  it('оставляет статические разделы как есть', () => {
    expect(normalizeVisitPath('/')).toBe('/')
    expect(normalizeVisitPath('/teams')).toBe('/teams')
    expect(normalizeVisitPath('/players')).toBe('/players')
    expect(normalizeVisitPath('/bracket')).toBe('/bracket')
  })

  it('схлопывает карточки команд и игроков в один раздел', () => {
    expect(normalizeVisitPath('/teams/abc-123')).toBe('/teams/:id')
    expect(normalizeVisitPath('/players/xyz-789')).toBe('/players/:id')
  })
})
