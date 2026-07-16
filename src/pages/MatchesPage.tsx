import { useMemo, useState } from 'react'
import { useTournamentData } from '../hooks/useTournamentData'
import { MatchRow } from '../components/MatchRow'
import type { GroupId, Match } from '../types'

const GROUPS: GroupId[] = ['A', 'B', 'C', 'D']

type StatusFilter = 'all' | 'upcoming' | 'finished'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'finished', label: 'Завершённые' },
  { value: 'all', label: 'Все' },
]

function formatDayHeading(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
}

export function MatchesPage() {
  const { data } = useTournamentData()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming')
  const [groupFilter, setGroupFilter] = useState<GroupId | 'all'>('all')
  const [teamFilter, setTeamFilter] = useState<string | 'all'>('all')

  const teamsMap = useMemo(() => new Map(data.teams.map((t) => [t.id, t])), [data.teams])
  const sortedTeams = useMemo(() => [...data.teams].sort((a, b) => a.name.localeCompare(b.name)), [data.teams])

  const filtered = useMemo(() => {
    return data.matches
      .filter((m) => statusFilter === 'all' || (statusFilter === 'upcoming' ? m.status === 'scheduled' : m.status !== 'scheduled'))
      .filter((m) => groupFilter === 'all' || m.group === groupFilter)
      .filter((m) => teamFilter === 'all' || m.teamAId === teamFilter || m.teamBId === teamFilter)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
  }, [data.matches, statusFilter, groupFilter, teamFilter])

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, Match[]>()
    for (const m of filtered) {
      const list = groups.get(m.date) ?? []
      list.push(m)
      groups.set(m.date, list)
    }
    return [...groups.entries()]
  }, [filtered])

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase text-white">Матчи</h1>
          <p className="text-slate-500 text-sm mt-2">Все игры турнира, сгруппированные по дням.</p>
        </div>

        <div className="flex gap-1 mb-5 border-b border-slate-800">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wide border-b-2 -mb-px transition-colors ${
                statusFilter === tab.value
                  ? 'border-court-400 text-court-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value as GroupId | 'all')}
            className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">Все группы</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                Группа {g}
              </option>
            ))}
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">Все команды</option>
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {groupedByDay.length === 0 && <p className="text-slate-500 text-sm pb-8">Матчи не найдены.</p>}
      </div>

      <div className="pb-8">
        {groupedByDay.map(([date, matches], idx) => (
          <div key={date} className={idx % 2 === 0 ? 'bg-slate-800/50' : 'bg-transparent'}>
            <div className="max-w-4xl mx-auto px-4 py-6 overflow-x-auto">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 capitalize">
                {formatDayHeading(date)}
              </h2>
              <div className="flex flex-col min-w-[720px]">
                {matches.map((m) => (
                  <MatchRow key={m.id} match={m} teamA={teamsMap.get(m.teamAId)} teamB={teamsMap.get(m.teamBId)} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
