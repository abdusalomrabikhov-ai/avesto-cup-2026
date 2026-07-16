import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Star, Phone } from 'lucide-react'
import { useTournamentData } from '../hooks/useTournamentData'
import { TeamBadge } from '../components/TeamBadge'
import { formatDate } from '../lib/formatDate'

export function PlayerPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const { data } = useTournamentData()

  const player = data.players.find((p) => p.id === playerId)
  const team = player ? data.teams.find((t) => t.id === player.teamId) : undefined

  const matchPoints = useMemo(() => {
    if (!player) return []
    return data.matches
      .flatMap((m) =>
        m.playerStats
          .filter((s) => s.playerId === player.id)
          .map((s) => ({ matchId: m.id, date: m.date, points: s.points })),
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [data.matches, player])

  const totalPoints = matchPoints.reduce((sum, m) => sum + m.points, 0)

  if (!player) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-slate-400">Игрок не найден.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/players" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8">
        <ArrowLeft className="h-4 w-4" /> К рейтингу
      </Link>

      <div className="flex items-center gap-5 mb-10">
        <div className="h-20 w-20 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">
          {player.photo ? (
            <img src={player.photo} alt={player.fullName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-slate-500">{player.fullName.slice(0, 1)}</span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black italic uppercase text-white leading-none">{player.fullName}</h1>
            {player.isCaptain && <Star className="h-5 w-5 text-gold-400 shrink-0" fill="currentColor" />}
          </div>
          <p className="text-slate-500 text-sm mt-1.5">{player.position}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-400">
            {team && <TeamBadge team={team} size="sm" />}
            <span className="tabular-nums">№{player.number}</span>
            <span>{player.birthDate}</span>
            {player.isCaptain && player.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {player.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl font-black italic uppercase text-white">Очки по матчам</h2>
          {totalPoints > 0 && <span className="text-2xl font-black text-court-400 tabular-nums">{totalPoints}</span>}
        </div>
        {matchPoints.length === 0 ? (
          <p className="text-slate-500 text-sm">Статистика не внесена.</p>
        ) : (
          <div className="divide-y divide-slate-800/70 border-t border-slate-800/70">
            {matchPoints.map((mp) => (
              <div key={mp.matchId} className="flex items-center justify-between py-3 text-sm">
                <span className="text-slate-500">{formatDate(mp.date)}</span>
                <span className="font-bold text-slate-200 tabular-nums">{mp.points}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
