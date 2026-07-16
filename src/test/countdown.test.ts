import { describe, expect, it } from 'vitest'
import { getCountdownParts } from '../lib/countdown'

describe('getCountdownParts', () => {
  it('считает дни/часы/минуты/секунды до будущей даты', () => {
    const now = new Date('2026-01-01T00:00:00')
    const target = '2026-01-02T01:02:03'
    const parts = getCountdownParts(target, now)
    expect(parts).toEqual({ days: 1, hours: 1, minutes: 2, seconds: 3, isPast: false })
  })

  it('возвращает isPast=true и нули для прошедшей даты', () => {
    const now = new Date('2026-01-02T00:00:00')
    const target = '2026-01-01T00:00:00'
    const parts = getCountdownParts(target, now)
    expect(parts).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true })
  })
})
