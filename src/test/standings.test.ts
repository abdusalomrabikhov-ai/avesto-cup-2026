import { describe, expect, it } from 'vitest'
import { buildGroupStandings } from '../lib/standings'
import type { Match, Team } from '../types'

function team(id: string, group: Team['group'] = 'A'): Team {
  return { id, name: id, company: id, group, logo: null }
}

function finishedMatch(
  id: string,
  teamAId: string,
  teamBId: string,
  scoreA: number,
  scoreB: number,
  extra: Partial<Match> = {},
): Match {
  return {
    id,
    stage: 'group',
    group: 'A',
    date: '2026-01-01',
    teamAId,
    teamBId,
    scoreA,
    scoreB,
    status: 'finished',
    isForfeit: false,
    overtimes: [],
    playerStats: [],
    ...extra,
  }
}

describe('buildGroupStandings', () => {
  it('считает победы/поражения и очки (2/1/0)', () => {
    const teams = [team('X'), team('Y')]
    const matches = [finishedMatch('m1', 'X', 'Y', 50, 40)]
    const rows = buildGroupStandings('A', teams, matches)

    const x = rows.find((r) => r.team.id === 'X')!
    const y = rows.find((r) => r.team.id === 'Y')!
    expect(x.wins).toBe(1)
    expect(x.points).toBe(2)
    expect(y.losses).toBe(1)
    expect(y.points).toBe(1)
  })

  it('неявка даёт проигравшему 0 очков, а не 1', () => {
    const teams = [team('X'), team('Y')]
    const matches = [
      finishedMatch('m1', 'X', 'Y', 20, 0, {
        status: 'forfeit',
        isForfeit: true,
        forfeitLoserId: 'Y',
      }),
    ]
    const rows = buildGroupStandings('A', teams, matches)
    const y = rows.find((r) => r.team.id === 'Y')!
    expect(y.points).toBe(0)
  })

  it('при равенстве очков решает личная встреча', () => {
    // X и Y оба сыграли по 1 матчу с равным числом очков в таблице (по 2 победы = 4 очка каждая),
    // но личная встреча между ними решает в пользу X
    const teams = [team('X'), team('Y'), team('Z')]
    const matches = [
      finishedMatch('m1', 'X', 'Y', 60, 50), // X выиграл личную встречу
      finishedMatch('m2', 'Y', 'Z', 70, 40),
      finishedMatch('m3', 'X', 'Z', 30, 90), // X проиграл Z, чтобы очки X и Y совпали (по 3)
    ]
    const rows = buildGroupStandings('A', teams, matches)
    const xIdx = rows.findIndex((r) => r.team.id === 'X')
    const yIdx = rows.findIndex((r) => r.team.id === 'Y')
    expect(rows[xIdx].points).toBe(rows[yIdx].points)
    expect(xIdx).toBeLessThan(yIdx)
  })

  it('без личных встреч и равной общей разнице решает жребий', () => {
    const teams = [team('X'), team('Y')]
    // Одинаковые очки, одинаковая разница, одинаковое число заброшенных — искусственно (нет матчей вовсе)
    const matches: Match[] = []
    const rows = buildGroupStandings('A', teams, matches, [
      { group: 'A', teamAId: 'X', teamBId: 'Y', winnerTeamId: 'Y' },
    ])
    const xIdx = rows.findIndex((r) => r.team.id === 'X')
    const yIdx = rows.findIndex((r) => r.team.id === 'Y')
    expect(yIdx).toBeLessThan(xIdx)
  })

  it('топ-2 помечены как проходящие в плей-офф', () => {
    const teams = [team('X'), team('Y'), team('Z')]
    const matches = [
      finishedMatch('m1', 'X', 'Y', 60, 50),
      finishedMatch('m2', 'X', 'Z', 60, 40),
      finishedMatch('m3', 'Y', 'Z', 55, 45),
    ]
    const rows = buildGroupStandings('A', teams, matches)
    expect(rows[0].qualifiesForPlayoff).toBe(true)
    expect(rows[1].qualifiesForPlayoff).toBe(true)
    expect(rows[2].qualifiesForPlayoff).toBe(false)
  })
})
