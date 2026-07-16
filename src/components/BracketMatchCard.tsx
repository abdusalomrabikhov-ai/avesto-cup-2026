import type { BracketSlot } from '../lib/playoff'
import { resolveMatchWinner } from '../lib/playoff'
import type { Team } from '../types'
import { TeamBadge } from './TeamBadge'

interface Props {
  slot: BracketSlot
  teams: Map<string, Team>
  label?: string
}

function SlotRow({
  teamId,
  teams,
  score,
  isWinner,
}: {
  teamId: string | null
  teams: Map<string, Team>
  score: number | null
  isWinner: boolean
}) {
  const team = teamId ? teams.get(teamId) : undefined

  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2.5 ${isWinner ? 'bg-court-500/[0.08]' : ''}`}>
      {team ? (
        <TeamBadge team={team} size="sm" linkToTeam={false} />
      ) : (
        <span className="text-slate-600 text-sm italic">TBD</span>
      )}
      <span className={`font-black text-sm tabular-nums ${isWinner ? 'text-court-400' : 'text-slate-500'}`}>
        {score ?? '—'}
      </span>
    </div>
  )
}

export function BracketMatchCard({ slot, teams, label }: Props) {
  const winner = slot.match ? resolveMatchWinner(slot.match) : null
  const overtimeCount = slot.match?.overtimes.length ?? 0

  return (
    <div className="border border-slate-800 w-56 shrink-0">
      {label && (
        <div className="px-3 py-1.5 bg-slate-900 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {label}
        </div>
      )}
      <SlotRow
        teamId={slot.teamAId}
        teams={teams}
        score={slot.match?.scoreA ?? null}
        isWinner={winner != null && winner === slot.teamAId}
      />
      <div className="h-px bg-slate-800" />
      <SlotRow
        teamId={slot.teamBId}
        teams={teams}
        score={slot.match?.scoreB ?? null}
        isWinner={winner != null && winner === slot.teamBId}
      />
      {overtimeCount > 0 && (
        <div className="px-3 py-1 text-[11px] text-gold-400 border-t border-slate-800">
          Овертайм ×{overtimeCount}
        </div>
      )}
    </div>
  )
}
