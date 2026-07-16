import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTournamentData } from '../hooks/useTournamentData'
import { TeamLogo } from '../components/TeamLogo'

const PINNED_TEAM_ID = 't-avesto'

export function TeamsPage() {
  const { data } = useTournamentData()

  const sortedTeams = useMemo(() => {
    const pinned = data.teams.filter((t) => t.id === PINNED_TEAM_ID)
    const rest = data.teams
      .filter((t) => t.id !== PINNED_TEAM_ID)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    return [...pinned, ...rest]
  }, [data.teams])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-black italic uppercase text-white">Команды турнира</h1>
        <p className="text-slate-500 text-sm mt-2">{data.teams.length} команд, разбитых на 4 группы.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {sortedTeams.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="flex flex-col items-center gap-3 text-center group"
          >
            <TeamLogo
              team={team}
              size="2xl"
              className="!h-24 !w-24 sm:!h-28 sm:!w-28 border-2 group-hover:border-court-400 transition-colors"
            />
            <span className="font-bold uppercase text-white group-hover:text-court-400 transition-colors">
              {team.name}
            </span>
            <span className="text-xs text-slate-500 -mt-2">Группа {team.group}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
