// Неявка на матч -> автоматический счёт 0:20 в пользу явившейся команды
import type { Match } from '../types'

export function applyForfeitScore(match: Match, forfeitLoserId: string): Match {
  const loserIsA = match.teamAId === forfeitLoserId
  return {
    ...match,
    isForfeit: true,
    status: 'forfeit',
    forfeitLoserId,
    scoreA: loserIsA ? 0 : 20,
    scoreB: loserIsA ? 20 : 0,
  }
}
