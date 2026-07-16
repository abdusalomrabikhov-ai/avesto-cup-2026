import { Link } from 'react-router-dom'
import type { Match, Team } from '../types'
import { MATCH_STAGE_LABELS, MATCH_STATUS_LABELS } from '../types'
import { formatDate } from '../lib/formatDate'
import { TeamLogo } from './TeamLogo'

interface Props {
  match: Match
  teamA: Team | undefined
  teamB: Team | undefined
  showStage?: boolean
}

const STATUS_STYLES: Record<Match['status'], string> = {
  scheduled: 'bg-slate-800 text-slate-300',
  finished: 'bg-court-500/15 text-court-400',
  forfeit: 'bg-red-500/15 text-red-400',
}

function TeamColumn({ team, isWinner }: { team: Team; isWinner: boolean }) {
  return (
    <div className="w-32 shrink-0 flex flex-col items-center gap-2">
      <TeamLogo team={team} size="lg" />
      <span className="text-sm font-bold uppercase text-white text-center leading-tight line-clamp-2 min-h-[2.5em]">
        {team.name}
      </span>
      <span className={`text-[11px] font-bold uppercase tracking-wide text-court-400 ${isWinner ? '' : 'invisible'}`}>
        Победа
      </span>
    </div>
  )
}

export function MatchRow({ match, teamA, teamB, showStage = true }: Props) {
  if (!teamA || !teamB) return null

  const hasScore = match.scoreA != null && match.scoreB != null
  const otSuffix = match.overtimes.length > 0 ? ` (ОТ×${match.overtimes.length})` : ''
  const teamAWon = hasScore && match.scoreA! > match.scoreB!
  const teamBWon = hasScore && match.scoreB! > match.scoreA!

  return (
    <Link
      to="/matches"
      className="grid grid-cols-[minmax(9rem,1fr)_7rem_minmax(9rem,1fr)_8rem_10rem] items-center gap-4 py-5 border-b border-slate-800/70 hover:pl-1 transition-all"
    >
      <div className="justify-self-end">
        <TeamColumn team={teamA} isWinner={teamAWon} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="font-black italic text-lg text-white whitespace-nowrap">
          {hasScore ? `${match.scoreA} : ${match.scoreB}` : 'VS'}
          {otSuffix}
        </span>
        <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(match.date)}</span>
        {match.time && <span className="text-xs text-slate-600 whitespace-nowrap">{match.time}</span>}
      </div>

      <div className="justify-self-start">
        <TeamColumn team={teamB} isWinner={teamBWon} />
      </div>

      {showStage ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{MATCH_STAGE_LABELS[match.stage]}</span>
          {match.group && <span className="text-xs text-slate-500">Группа {match.group}</span>}
        </div>
      ) : (
        <span />
      )}

      <span className={`text-xs px-3 py-1 font-bold uppercase tracking-wide whitespace-nowrap text-center w-full ${STATUS_STYLES[match.status]}`}>
        {MATCH_STATUS_LABELS[match.status]}
      </span>
    </Link>
  )
}
