// Единый источник правды по типам турнира «Кубок Авесто-2026»

export type GroupId = 'A' | 'B' | 'C' | 'D'

// Четвертьфинал добавлен, т.к. регламент не может свести 8 команд к 2 полуфиналам без него
export type MatchStage = 'group' | 'quarterfinal' | 'semifinal' | 'third_place' | 'final'

export const MATCH_STAGE_LABELS: Record<MatchStage, string> = {
  group: 'Групповой этап',
  quarterfinal: '1/4 финала',
  semifinal: 'Полуфинал',
  third_place: 'Матч за 3-е место',
  final: 'Финал',
}

export type MatchStatus = 'scheduled' | 'finished' | 'forfeit'

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: 'Запланирован',
  finished: 'Завершён',
  forfeit: 'Тех. поражение',
}

export interface Team {
  id: string
  name: string
  company: string
  group: GroupId
  logo: string | null
}

export interface Player {
  id: string
  teamId: string
  fullName: string
  birthDate: string
  position: string // должность в компании (не игровое амплуа)
  number: number
  photo: string | null
  isCaptain: boolean
  phone: string | null
}

export interface PlayerMatchStat {
  playerId: string
  points: number
}

export interface Overtime {
  index: number
  scoreA: number
  scoreB: number
}

export interface Match {
  id: string
  stage: MatchStage
  group: GroupId | null
  date: string
  time?: string
  teamAId: string
  teamBId: string
  scoreA: number | null
  scoreB: number | null
  status: MatchStatus
  isForfeit: boolean
  forfeitLoserId?: string
  overtimes: Overtime[]
  playerStats: PlayerMatchStat[]
}

export type AwardType = 'mvp' | 'best_defender' | 'top_scorer'

export const AWARD_LABELS: Record<AwardType, string> = {
  mvp: 'Лучший игрок турнира',
  best_defender: 'Лучший защитник турнира',
  top_scorer: 'Лучший бомбардир турнира',
}

export interface Award {
  type: AwardType
  playerId: string | null
}

// Ручной флаг жребия для разрешения полного равенства показателей
export interface DrawLotEntry {
  group: GroupId
  teamAId: string
  teamBId: string
  winnerTeamId: string
}

export type CountdownMode = 'tournament_start' | 'final'

export const COUNTDOWN_MODE_LABELS: Record<CountdownMode, string> = {
  tournament_start: 'До начала турнира',
  final: 'До финала',
}

export interface CountdownSettings {
  mode: CountdownMode
  tournamentStart: string // ISO datetime
  final: string // ISO datetime
}

export interface TournamentData {
  teams: Team[]
  players: Player[]
  matches: Match[]
  awards: Award[]
  drawLots: DrawLotEntry[]
  countdown: CountdownSettings
}

export interface StandingsRow {
  team: Team
  played: number
  wins: number
  losses: number
  scored: number
  conceded: number
  diff: number
  points: number
  qualifiesForPlayoff: boolean
}
