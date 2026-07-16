// Сетка плей-офф: 8 команд (1-2 место каждой группы) -> 1/4 -> 1/2 -> 3-е место + финал
import type { DrawLotEntry, GroupId, Match, Team } from '../types'
import { buildGroupStandings } from './standings'

export interface BracketSlot {
  slot: string
  teamAId: string | null
  teamBId: string | null
  match: Match | null
}

export interface Bracket {
  quarterfinals: BracketSlot[]
  semifinals: BracketSlot[]
  thirdPlace: BracketSlot
  final: BracketSlot
}

// Кросс-посев по группам, чтобы команды одной группы не встретились в 1/4:
// QF1: A1-D2, QF2: B1-C2, QF3: C1-B2, QF4: D1-A2
const QF_PAIRS: [GroupId, 0 | 1, GroupId, 0 | 1][] = [
  ['A', 0, 'D', 1],
  ['B', 0, 'C', 1],
  ['C', 0, 'B', 1],
  ['D', 0, 'A', 1],
]

export function seedQuarterfinals(
  teams: Team[],
  matches: Match[],
  drawLots: DrawLotEntry[] = [],
): { slot: string; teamAId: string | null; teamBId: string | null }[] {
  const groups: GroupId[] = ['A', 'B', 'C', 'D']
  const top = new Map(
    groups.map((g) => [g, buildGroupStandings(g, teams, matches, drawLots).slice(0, 2)]),
  )

  const rank = (g: GroupId, i: 0 | 1) => top.get(g)?.[i]?.team.id ?? null

  return QF_PAIRS.map(([gA, iA, gB, iB], idx) => ({
    slot: `QF${idx + 1}`,
    teamAId: rank(gA, iA),
    teamBId: rank(gB, iB),
  }))
}

// Победитель матча с учётом овертаймов. null, если счёт не введён или ничья без овертайма
export function resolveMatchWinner(match: Match): string | null {
  if (match.scoreA == null || match.scoreB == null) return null
  let a = match.scoreA
  let b = match.scoreB
  for (const ot of match.overtimes) {
    a += ot.scoreA
    b += ot.scoreB
  }
  if (a === b) return null
  return a > b ? match.teamAId : match.teamBId
}

function findMatch(
  matches: Match[],
  stage: Match['stage'],
  teamAId: string | null,
  teamBId: string | null,
): Match | null {
  if (!teamAId || !teamBId) return null
  return (
    matches.find(
      (m) =>
        m.stage === stage &&
        ((m.teamAId === teamAId && m.teamBId === teamBId) ||
          (m.teamAId === teamBId && m.teamBId === teamAId)),
    ) ?? null
  )
}

export function buildBracket(
  teams: Team[],
  matches: Match[],
  drawLots: DrawLotEntry[] = [],
): Bracket {
  const qfPairings = seedQuarterfinals(teams, matches, drawLots)
  const quarterfinals: BracketSlot[] = qfPairings.map((p) => ({
    ...p,
    match: findMatch(matches, 'quarterfinal', p.teamAId, p.teamBId),
  }))

  const qfWinner = (i: number) => {
    const m = quarterfinals[i]?.match
    return m ? resolveMatchWinner(m) : null
  }

  const sf1Teams: [string | null, string | null] = [qfWinner(0), qfWinner(1)]
  const sf2Teams: [string | null, string | null] = [qfWinner(2), qfWinner(3)]

  const semifinals: BracketSlot[] = [
    {
      slot: 'SF1',
      teamAId: sf1Teams[0],
      teamBId: sf1Teams[1],
      match: findMatch(matches, 'semifinal', sf1Teams[0], sf1Teams[1]),
    },
    {
      slot: 'SF2',
      teamAId: sf2Teams[0],
      teamBId: sf2Teams[1],
      match: findMatch(matches, 'semifinal', sf2Teams[0], sf2Teams[1]),
    },
  ]

  const sfWinner = (i: number) => {
    const m = semifinals[i]?.match
    return m ? resolveMatchWinner(m) : null
  }
  const sfLoser = (i: number) => {
    const m = semifinals[i]?.match
    if (!m) return null
    const winner = resolveMatchWinner(m)
    if (!winner) return null
    return winner === m.teamAId ? m.teamBId : m.teamAId
  }

  const thirdPlaceTeams: [string | null, string | null] = [sfLoser(0), sfLoser(1)]
  const finalTeams: [string | null, string | null] = [sfWinner(0), sfWinner(1)]

  return {
    quarterfinals,
    semifinals,
    thirdPlace: {
      slot: 'THIRD',
      teamAId: thirdPlaceTeams[0],
      teamBId: thirdPlaceTeams[1],
      match: findMatch(matches, 'third_place', thirdPlaceTeams[0], thirdPlaceTeams[1]),
    },
    final: {
      slot: 'FINAL',
      teamAId: finalTeams[0],
      teamBId: finalTeams[1],
      match: findMatch(matches, 'final', finalTeams[0], finalTeams[1]),
    },
  }
}
