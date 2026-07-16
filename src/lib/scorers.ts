// Агрегация очков игроков по всем матчам -> рейтинг бомбардиров
import type { Match, Player } from '../types'

export interface LeaderboardRow {
  player: Player
  totalPoints: number
  gamesWithStats: number
}

export function buildScoringLeaderboard(players: Player[], matches: Match[]): LeaderboardRow[] {
  const totals = new Map<string, { points: number; games: number }>()

  for (const m of matches) {
    for (const stat of m.playerStats) {
      const cur = totals.get(stat.playerId) ?? { points: 0, games: 0 }
      cur.points += stat.points
      cur.games += 1
      totals.set(stat.playerId, cur)
    }
  }

  return players
    .filter((p) => totals.has(p.id))
    .map((p) => ({
      player: p,
      totalPoints: totals.get(p.id)!.points,
      gamesWithStats: totals.get(p.id)!.games,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
}
