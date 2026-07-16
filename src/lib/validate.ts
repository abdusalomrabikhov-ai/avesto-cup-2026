// Валидация состава команды: 5-12 игроков, уникальность игрока по всему турниру
import type { Player } from '../types'

export function validateRosterSize(players: Player[]): string | null {
  if (players.length < 5) return 'Нужно минимум 5 игроков'
  if (players.length > 12) return 'Максимум 12 игроков'
  return null
}

// Дубль ищется по ФИО+дате рождения, чтобы не путать полных тёзок
export function validatePlayerUniqueness(newPlayer: Player, allPlayers: Player[]): string | null {
  const dup = allPlayers.find(
    (p) =>
      p.id !== newPlayer.id &&
      p.teamId !== newPlayer.teamId &&
      p.fullName.trim().toLowerCase() === newPlayer.fullName.trim().toLowerCase() &&
      p.birthDate === newPlayer.birthDate,
  )
  return dup ? 'Игрок уже заявлен в другой команде' : null
}

export function validateCaptainPhone(isCaptain: boolean, phone: string | null): string | null {
  if (isCaptain && !phone?.trim()) return 'У капитана должен быть указан контактный телефон'
  return null
}
