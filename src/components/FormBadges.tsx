import type { Match } from '../types'
import { formatDate } from '../lib/formatDate'

interface Props {
  teamId: string
  matches: Match[]
  count?: number
}

// Форма команды: результаты последних N завершённых матчей, W/L
export function FormBadges({ teamId, matches, count = 5 }: Props) {
  const recent = matches
    .filter((m) => (m.status === 'finished' || m.status === 'forfeit') && (m.teamAId === teamId || m.teamBId === teamId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-count)

  if (recent.length === 0) {
    return <span className="text-xs text-slate-500">Нет сыгранных матчей</span>
  }

  return (
    <div className="flex items-center gap-1">
      {recent.map((m) => {
        const isTeamA = m.teamAId === teamId
        const own = isTeamA ? m.scoreA! : m.scoreB!
        const opp = isTeamA ? m.scoreB! : m.scoreA!
        const won = own > opp
        return (
          <span
            key={m.id}
            title={`${formatDate(m.date)}: ${own}:${opp}`}
            className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              won ? 'bg-court-500/20 text-court-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {won ? 'W' : 'L'}
          </span>
        )
      })}
    </div>
  )
}
