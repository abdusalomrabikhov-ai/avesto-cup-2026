import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { useTournamentData } from '../hooks/useTournamentData'
import { AWARD_LABELS } from '../types'
import type { AwardType } from '../types'

const AWARD_TYPES: AwardType[] = ['mvp', 'best_defender', 'top_scorer']

export function AwardsPage() {
  const { data } = useTournamentData()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-black italic uppercase text-white">Индивидуальные номинации</h1>
        <p className="text-slate-500 text-sm mt-2">Назначаются оргкомитетом в админ-панели.</p>
      </div>

      <div className="flex flex-col gap-8">
        {AWARD_TYPES.map((type, idx) => {
          const award = data.awards.find((a) => a.type === type)
          const player = award?.playerId ? data.players.find((p) => p.id === award.playerId) : null
          const team = player ? data.teams.find((t) => t.id === player.teamId) : null
          const isPrimary = idx === 0

          return (
            <div
              key={type}
              className={`flex items-center gap-5 ${isPrimary ? 'pb-8 border-b border-slate-700' : ''}`}
            >
              <Trophy className={isPrimary ? 'h-10 w-10 text-gold-400 shrink-0' : 'h-6 w-6 text-slate-600 shrink-0'} />

              {player ? (
                <Link to={`/players/${player.id}`} className="flex items-center gap-4 min-w-0 group">
                  <div
                    className={`shrink-0 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center ${isPrimary ? 'h-20 w-20' : 'h-12 w-12'}`}
                  >
                    {player.photo ? (
                      <img src={player.photo} alt={player.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-bold text-slate-500">{player.fullName.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{AWARD_LABELS[type]}</p>
                    <p
                      className={`font-black text-white group-hover:text-court-400 transition-colors truncate ${isPrimary ? 'text-2xl italic' : 'text-lg'}`}
                    >
                      {player.fullName}
                    </p>
                    {team && <p className="text-sm text-slate-500">{team.name}</p>}
                  </div>
                </Link>
              ) : (
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{AWARD_LABELS[type]}</p>
                  <p className="text-slate-600 italic mt-0.5">Ещё не назначено</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
