import { describe, expect, it } from 'vitest'
import { applyForfeitScore } from '../lib/forfeit'
import type { Match } from '../types'

function baseMatch(): Match {
  return {
    id: 'm1',
    stage: 'group',
    group: 'A',
    date: '2026-01-01',
    teamAId: 'X',
    teamBId: 'Y',
    scoreA: null,
    scoreB: null,
    status: 'scheduled',
    isForfeit: false,
    overtimes: [],
    playerStats: [],
  }
}

describe('applyForfeitScore', () => {
  it('ставит 0:20, если не явилась команда A', () => {
    const result = applyForfeitScore(baseMatch(), 'X')
    expect(result.scoreA).toBe(0)
    expect(result.scoreB).toBe(20)
    expect(result.status).toBe('forfeit')
    expect(result.isForfeit).toBe(true)
    expect(result.forfeitLoserId).toBe('X')
  })

  it('ставит 20:0, если не явилась команда B', () => {
    const result = applyForfeitScore(baseMatch(), 'Y')
    expect(result.scoreA).toBe(20)
    expect(result.scoreB).toBe(0)
    expect(result.forfeitLoserId).toBe('Y')
  })
})
