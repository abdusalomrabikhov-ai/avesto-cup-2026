// Стартовые данные турнира: команды, логотипы и расписание группового этапа
import type { Match, Team, TournamentData } from '../types'
import {
  LOGO_AKIA_AVESTO,
  LOGO_ARTEL_AVESTO,
  LOGO_ARVIS,
  LOGO_AVESTO,
  LOGO_AZOT,
  LOGO_CITYLINE,
  LOGO_CITY_SERVICE,
  LOGO_DC,
  LOGO_KOD,
  LOGO_MARMARI,
  LOGO_MUOSIR,
  LOGO_NETS,
  LOGO_NERU,
  LOGO_OLUCHA_TAXI,
  LOGO_SIYOMA,
  LOGO_SIYOMA_MALL,
  LOGO_ZET_MOBILE,
} from './logos'

interface TeamSeed {
  id: string
  name: string
  company: string
  group: Team['group']
  logo: string | null
}

const TEAMS: TeamSeed[] = [
  // Группа A (5 команд)
  { id: 't-zet', name: 'Зет-Мобайл', company: 'ООО «Zet-Mobile»', group: 'A', logo: LOGO_ZET_MOBILE },
  { id: 't-siyoma', name: 'Сиёма', company: 'ООО «Сиёма»', group: 'A', logo: LOGO_SIYOMA },
  { id: 't-cityline', name: 'Сити Лайн', company: 'ООО «Сити Лайн»', group: 'A', logo: LOGO_CITYLINE },
  { id: 't-neru', name: 'Неру', company: 'ООО «Neru»', group: 'A', logo: LOGO_NERU },
  { id: 't-arvis', name: 'Арвис', company: 'ООО «Арвис»', group: 'A', logo: LOGO_ARVIS },
  // Группа B (5 команд)
  { id: 't-akia', name: 'Акиа Авесто', company: 'ООО «Акиа Авесто»', group: 'B', logo: LOGO_AKIA_AVESTO },
  { id: 't-cityservice', name: 'Сити Сервис', company: 'ООО «Сити Сервис Лтд»', group: 'B', logo: LOGO_CITY_SERVICE },
  { id: 't-kod', name: 'Сафо', company: 'ООО «КОД»', group: 'B', logo: LOGO_KOD },
  { id: 't-olucha', name: 'Олуча Такси', company: 'ООО «Олуча Такси»', group: 'B', logo: LOGO_OLUCHA_TAXI },
  { id: 't-avesto', name: 'Авесто Групп', company: 'ООО «Авесто Групп» (ЦА)', group: 'B', logo: LOGO_AVESTO },
  // Группа C (4 команды)
  { id: 't-dc', name: 'Душанбе Сити Банк', company: 'ООО «ДС»', group: 'C', logo: LOGO_DC },
  { id: 't-azot', name: 'Азот', company: 'ООО «Азот»', group: 'C', logo: LOGO_AZOT },
  { id: 't-dcmarket', name: 'DC Маркет', company: 'ООО «ДС Маркет»', group: 'C', logo: LOGO_DC },
  { id: 't-nets', name: 'НЕТС', company: 'ООО «Нетс»', group: 'C', logo: LOGO_NETS },
  // Группа D (4 команды)
  { id: 't-siyomamall', name: 'Сиёма Молл', company: 'ООО «Сиёма Молл»', group: 'D', logo: LOGO_SIYOMA_MALL },
  { id: 't-muosir', name: 'Муосир', company: 'ООО «Муосир»', group: 'D', logo: LOGO_MUOSIR },
  { id: 't-artel', name: 'Артел Авесто', company: 'ООО «Артель Авесто»', group: 'D', logo: LOGO_ARTEL_AVESTO },
  { id: 't-marmari', name: 'Мармари', company: 'ООО «Мармари»', group: 'D', logo: LOGO_MARMARI },
]

const BYE = '__bye__'

// Круговая система «каждый с каждым» методом circle: делит все пары группы
// на раунды, где внутри одного раунда ни одна команда не встречается дважды
// (при нечётном числе команд одна из них в раунде отдыхает — раунд без пары
// вычёркивается). Это нужно, чтобы «2 игры в день» никогда не сталкивали
// одну и ту же команду в двух матчах одного дня.
function roundRobinRounds(teamIds: string[]): [string, string][][] {
  const ids = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, BYE]
  const n = ids.length
  const rounds: [string, string][][] = []
  const fixed = ids[0]
  let rotating = ids.slice(1)

  for (let r = 0; r < n - 1; r++) {
    const roundIds = [fixed, ...rotating]
    const round: [string, string][] = []
    for (let i = 0; i < n / 2; i++) {
      const a = roundIds[i]
      const b = roundIds[n - 1 - i]
      if (a !== BYE && b !== BYE) round.push([a, b])
    }
    rounds.push(round)
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]
  }

  return rounds
}

const TOURNAMENT_START = '2026-07-20'

// Через Date.UTC, чтобы локальный часовой пояс не сдвигал дату на день назад/вперёд
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utc = new Date(Date.UTC(y, m - 1, d + days))
  return utc.toISOString().slice(0, 10)
}

// Расписание группового этапа: каждый день — 2 группы играют по одному
// раунду каждая (раунд = все матчи, где ни одна команда не встречается
// дважды — при 5 командах это 2 матча, при 4 тоже 2). Группы A+B чередуются
// с C+D по дням; когда у пары групп заканчиваются раунды (C+D короче из-за
// 4 команд против 5), оставшиеся дни идут только по второй паре.
function buildGroupMatches(): Match[] {
  const roundsByGroup: Record<Team['group'], [string, string][][]> = {
    A: roundRobinRounds(TEAMS.filter((t) => t.group === 'A').map((t) => t.id)),
    B: roundRobinRounds(TEAMS.filter((t) => t.group === 'B').map((t) => t.id)),
    C: roundRobinRounds(TEAMS.filter((t) => t.group === 'C').map((t) => t.id)),
    D: roundRobinRounds(TEAMS.filter((t) => t.group === 'D').map((t) => t.id)),
  }
  const cursor: Record<Team['group'], number> = { A: 0, B: 0, C: 0, D: 0 }

  const dayGroupSets: Team['group'][][] = [
    ['A', 'B'],
    ['C', 'D'],
  ]

  const matches: Match[] = []
  let dayIndex = 0
  let setIdx = 0
  let matchCounter = 0

  const hasRemaining = () =>
    (['A', 'B', 'C', 'D'] as const).some((g) => cursor[g] < roundsByGroup[g].length)

  while (hasRemaining()) {
    const groups = dayGroupSets[setIdx % dayGroupSets.length]
    setIdx++

    const groupsWithGames = groups.filter((g) => cursor[g] < roundsByGroup[g].length)
    if (groupsWithGames.length === 0) continue

    const date = addDays(TOURNAMENT_START, dayIndex)
    dayIndex++

    for (const group of groupsWithGames) {
      const round = roundsByGroup[group][cursor[group]]
      cursor[group]++

      for (const [teamAId, teamBId] of round) {
        matchCounter++
        matches.push({
          id: `m-group-${group}-${matchCounter}`,
          stage: 'group',
          group,
          date,
          teamAId,
          teamBId,
          scoreA: null,
          scoreB: null,
          status: 'scheduled',
          isForfeit: false,
          overtimes: [],
          playerStats: [],
        })
      }
    }
  }

  return matches
}

// Пересобрать только расписание группового этапа (даты и пары матчей),
// не трогая команды/логотипы/игроков — для случаев когда меняется только
// логика построения календаря
export function buildGroupSchedule(): Match[] {
  return buildGroupMatches()
}

export function buildSeedData(): TournamentData {
  const teams: Team[] = TEAMS.map((t) => ({ ...t }))

  return {
    teams,
    players: [],
    matches: buildGroupMatches(),
    awards: [
      { type: 'mvp', playerId: null },
      { type: 'best_defender', playerId: null },
      { type: 'top_scorer', playerId: null },
    ],
    drawLots: [],
    countdown: {
      mode: 'tournament_start',
      tournamentStart: '2026-08-01T10:00',
      final: '2026-09-15T18:00',
    },
  }
}
