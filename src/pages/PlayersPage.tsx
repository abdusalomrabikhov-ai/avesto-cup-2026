import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTournamentData } from '../hooks/useTournamentData'
import { buildScoringLeaderboard } from '../lib/scorers'
import { TeamBadge } from '../components/TeamBadge'

export function PlayersPage() {
  const { data } = useTournamentData()
  const teamsMap = useMemo(() => new Map(data.teams.map((t) => [t.id, t])), [data.teams])
  const leaderboard = useMemo(
    () => buildScoringLeaderboard(data.players, data.matches).slice(0, 20),
    [data.players, data.matches],
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-black italic uppercase text-white">Рейтинг бомбардиров</h1>
        <p className="text-slate-500 text-sm mt-2">Считается автоматически по очкам, внесённым в результатах матчей.</p>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-slate-500 text-sm">Статистика пока не внесена.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[360px]">
            <thead>
              <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
                <th className="pb-2 text-left font-medium w-8"></th>
                <th className="pb-2 text-left font-medium">Игрок</th>
                <th className="pb-2 text-left font-medium hidden sm:table-cell">Команда</th>
                <th className="pb-2 text-center font-medium">Игры</th>
                <th className="pb-2 text-right font-medium">Очки</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => {
                const team = teamsMap.get(row.player.teamId)
                const isLeader = idx === 0
                return (
                  <tr key={row.player.id} className="border-t border-slate-800/70">
                    <td className={`py-3 tabular-nums text-xs ${isLeader ? 'text-gold-400 font-bold' : 'text-slate-500'}`}>
                      {idx + 1}
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/players/${row.player.id}`}
                        className={`hover:text-court-400 transition-colors ${isLeader ? 'font-bold text-white' : 'font-medium text-slate-200'}`}
                      >
                        {row.player.fullName}
                      </Link>
                    </td>
                    <td className="py-3 hidden sm:table-cell">{team && <TeamBadge team={team} size="sm" />}</td>
                    <td className="py-3 text-center text-slate-500 tabular-nums">{row.gamesWithStats}</td>
                    <td
                      className={`py-3 text-right tabular-nums pr-1 ${isLeader ? 'font-black text-xl text-gold-400' : 'font-bold text-court-400'}`}
                    >
                      {row.totalPoints}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
