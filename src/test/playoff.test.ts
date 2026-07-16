import { describe, expect, it } from 'vitest'
import { buildBracket, resolveMatchWinner, seedQuarterfinals } from '../lib/playoff'
import type { GroupId, Match, Team } from '../types'

function team(id: string, group: GroupId): Team {
  return { id, name: id, company: id, group, logo: null }
}

function win(id: string, group: GroupId, teamAId: string, teamBId: string): Match {
  return {
    id,
    stage: 'group',
    group,
    date: '2026-01-01',
    teamAId,
    teamBId,
    scoreA: 60,
    scoreB: 40,
    status: 'finished',
    isForfeit: false,
    overtimes: [],
    playerStats: [],
  }
}

// Каждая группа: team1 обыгрывает team2 и team3, team2 обыгрывает team3 -> 1-е и 2-е место предсказуемы
function groupMatches(group: GroupId, t1: string, t2: string, t3: string): Match[] {
  return [
    win(`${group}-1`, group, t1, t2),
    win(`${group}-2`, group, t1, t3),
    win(`${group}-3`, group, t2, t3),
  ]
}

describe('seedQuarterfinals', () => {
  it('сеет 1-2 места групп крест-накрест без встречи команд одной группы', () => {
    const teams: Team[] = [
      team('A1', 'A'), team('A2', 'A'), team('A3', 'A'),
      team('B1', 'B'), team('B2', 'B'), team('B3', 'B'),
      team('C1', 'C'), team('C2', 'C'), team('C3', 'C'),
      team('D1', 'D'), team('D2', 'D'), team('D3', 'D'),
    ]
    const matches = [
      ...groupMatches('A', 'A1', 'A2', 'A3'),
      ...groupMatches('B', 'B1', 'B2', 'B3'),
      ...groupMatches('C', 'C1', 'C2', 'C3'),
      ...groupMatches('D', 'D1', 'D2', 'D3'),
    ]

    const pairs = seedQuarterfinals(teams, matches)
    expect(pairs).toEqual([
      { slot: 'QF1', teamAId: 'A1', teamBId: 'D2' },
      { slot: 'QF2', teamAId: 'B1', teamBId: 'C2' },
      { slot: 'QF3', teamAId: 'C1', teamBId: 'B2' },
      { slot: 'QF4', teamAId: 'D1', teamBId: 'A2' },
    ])
  })
})

describe('resolveMatchWinner', () => {
  it('возвращает null для ничьей без овертайма', () => {
    const m: Match = {
      id: 'm', stage: 'semifinal', group: null, date: '2026-01-01',
      teamAId: 'X', teamBId: 'Y', scoreA: 50, scoreB: 50,
      status: 'finished', isForfeit: false, overtimes: [], playerStats: [],
    }
    expect(resolveMatchWinner(m)).toBeNull()
  })

  it('учитывает овертайм при определении победителя', () => {
    const m: Match = {
      id: 'm', stage: 'semifinal', group: null, date: '2026-01-01',
      teamAId: 'X', teamBId: 'Y', scoreA: 50, scoreB: 50,
      status: 'finished', isForfeit: false,
      overtimes: [{ index: 1, scoreA: 8, scoreB: 5 }],
      playerStats: [],
    }
    expect(resolveMatchWinner(m)).toBe('X')
  })
})

describe('buildBracket', () => {
  it('незаполненные пары следующего раунда отображаются как TBD (null)', () => {
    const teams: Team[] = [
      team('A1', 'A'), team('A2', 'A'),
      team('B1', 'B'), team('B2', 'B'),
      team('C1', 'C'), team('C2', 'C'),
      team('D1', 'D'), team('D2', 'D'),
    ]
    const bracket = buildBracket(teams, [])
    expect(bracket.quarterfinals).toHaveLength(4)
    expect(bracket.semifinals[0].teamAId).toBeNull()
    expect(bracket.final.teamAId).toBeNull()
  })
})
