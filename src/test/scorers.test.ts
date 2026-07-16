import { describe, expect, it } from 'vitest'
import { buildScoringLeaderboard } from '../lib/scorers'
import type { Match, Player } from '../types'

function player(id: string): Player {
  return {
    id,
    teamId: 'T1',
    fullName: id,
    birthDate: '2000-01-01',
    position: 'Менеджер',
    number: 1,
    photo: null,
    isCaptain: false,
    phone: null,
  }
}

function matchWithStats(id: string, stats: { playerId: string; points: number }[]): Match {
  return {
    id,
    stage: 'group',
    group: 'A',
    date: '2026-01-01',
    teamAId: 'T1',
    teamBId: 'T2',
    scoreA: 10,
    scoreB: 5,
    status: 'finished',
    isForfeit: false,
    overtimes: [],
    playerStats: stats,
  }
}

describe('buildScoringLeaderboard', () => {
  it('суммирует очки игрока по нескольким матчам', () => {
    const players = [player('P1')]
    const matches = [
      matchWithStats('m1', [{ playerId: 'P1', points: 12 }]),
      matchWithStats('m2', [{ playerId: 'P1', points: 8 }]),
    ]
    const board = buildScoringLeaderboard(players, matches)
    expect(board[0].totalPoints).toBe(20)
    expect(board[0].gamesWithStats).toBe(2)
  })

  it('не показывает игроков без внесённой статистики', () => {
    const players = [player('P1'), player('P2')]
    const matches = [matchWithStats('m1', [{ playerId: 'P1', points: 5 }])]
    const board = buildScoringLeaderboard(players, matches)
    expect(board).toHaveLength(1)
    expect(board[0].player.id).toBe('P1')
  })

  it('сортирует по убыванию очков', () => {
    const players = [player('P1'), player('P2')]
    const matches = [
      matchWithStats('m1', [
        { playerId: 'P1', points: 5 },
        { playerId: 'P2', points: 30 },
      ]),
    ]
    const board = buildScoringLeaderboard(players, matches)
    expect(board[0].player.id).toBe('P2')
    expect(board[1].player.id).toBe('P1')
  })
})
