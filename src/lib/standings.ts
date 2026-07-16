// Построение турнирной таблицы группы: агрегация матчей + полный каскад тай-брейков
import type { DrawLotEntry, GroupId, Match, StandingsRow, Team } from '../types'

interface TeamAgg {
  team: Team
  played: number
  wins: number
  losses: number
  scored: number
  conceded: number
  points: number
}

function aggregateGroupMatches(teams: Team[], matches: Match[]): Map<string, TeamAgg> {
  const agg = new Map<string, TeamAgg>(
    teams.map((t) => [
      t.id,
      { team: t, played: 0, wins: 0, losses: 0, scored: 0, conceded: 0, points: 0 },
    ]),
  )

  for (const m of matches) {
    if (m.status !== 'finished' && m.status !== 'forfeit') continue
    const a = agg.get(m.teamAId)
    const b = agg.get(m.teamBId)
    if (!a || !b || m.scoreA == null || m.scoreB == null) continue

    a.played++
    b.played++
    a.scored += m.scoreA
    a.conceded += m.scoreB
    b.scored += m.scoreB
    b.conceded += m.scoreA

    if (m.scoreA > m.scoreB) {
      a.wins++
      a.points += 2
      b.losses++
      b.points += m.isForfeit && m.forfeitLoserId === m.teamBId ? 0 : 1
    } else {
      b.wins++
      b.points += 2
      a.losses++
      a.points += m.isForfeit && m.forfeitLoserId === m.teamAId ? 0 : 1
    }
  }

  return agg
}

// Личные встречи между парой команд (учитываются только сыгранные матчи группового этапа)
function headToHead(teamAId: string, teamBId: string, matches: Match[]): Match[] {
  return matches.filter(
    (m) =>
      m.status !== 'scheduled' &&
      ((m.teamAId === teamAId && m.teamBId === teamBId) ||
        (m.teamAId === teamBId && m.teamBId === teamAId)),
  )
}

function compareByDrawLot(
  aId: string,
  bId: string,
  group: GroupId,
  drawLots: DrawLotEntry[],
): number {
  const lot = drawLots.find(
    (d) =>
      d.group === group &&
      ((d.teamAId === aId && d.teamBId === bId) || (d.teamAId === bId && d.teamBId === aId)),
  )
  if (!lot) return 0
  return lot.winnerTeamId === aId ? -1 : 1
}

export function buildGroupStandings(
  group: GroupId,
  allTeams: Team[],
  allMatches: Match[],
  drawLots: DrawLotEntry[] = [],
): StandingsRow[] {
  const teams = allTeams.filter((t) => t.group === group)
  const matches = allMatches.filter((m) => m.stage === 'group' && m.group === group)
  const agg = aggregateGroupMatches(teams, matches)

  const rows = [...agg.values()]
  rows.sort((rowA, rowB) => {
    if (rowB.points !== rowA.points) return rowB.points - rowA.points

    // 1-2. Личная встреча: результат, затем разница очков в личных встречах
    const h2h = headToHead(rowA.team.id, rowB.team.id, matches)
    if (h2h.length > 0) {
      let aPts = 0
      let bPts = 0
      let aScored = 0
      let aConceded = 0
      for (const m of h2h) {
        const aIsTeamA = m.teamAId === rowA.team.id
        const aScore = aIsTeamA ? m.scoreA! : m.scoreB!
        const bScore = aIsTeamA ? m.scoreB! : m.scoreA!
        aScored += aScore
        aConceded += bScore
        if (aScore > bScore) aPts += 2
        else if (aScore < bScore) bPts += 2
      }
      if (aPts !== bPts) return bPts - aPts
      const h2hDiff = aScored - aConceded
      if (h2hDiff !== 0) return -h2hDiff
    }

    // 3. Общая разница заброшенных/пропущенных очков
    const diffA = rowA.scored - rowA.conceded
    const diffB = rowB.scored - rowB.conceded
    if (diffA !== diffB) return diffB - diffA

    // 4. Общее количество заброшенных очков
    if (rowB.scored !== rowA.scored) return rowB.scored - rowA.scored

    // 5. Жребий (ручной флаг в админке)
    return compareByDrawLot(rowA.team.id, rowB.team.id, group, drawLots)
  })

  return rows.map((r, i) => ({
    team: r.team,
    played: r.played,
    wins: r.wins,
    losses: r.losses,
    scored: r.scored,
    conceded: r.conceded,
    diff: r.scored - r.conceded,
    points: r.points,
    qualifiesForPlayoff: i < 2,
  }))
}
