import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTournamentData } from '../hooks/useTournamentData'
import { PlayerCard } from '../components/PlayerCard'
import { MatchRow } from '../components/MatchRow'
import { FormBadges } from '../components/FormBadges'
import { TeamLogo } from '../components/TeamLogo'
import { buildScoringLeaderboard } from '../lib/scorers'

export function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const { data } = useTournamentData()

  const team = data.teams.find((t) => t.id === teamId)
  const teamsMap = useMemo(() => new Map(data.teams.map((t) => [t.id, t])), [data.teams])

  const roster = useMemo(
    () => data.players.filter((p) => p.teamId === teamId).sort((a, b) => (b.isCaptain ? 1 : 0) - (a.isCaptain ? 1 : 0)),
    [data.players, teamId],
  )

  const teamMatches = useMemo(
    () =>
      data.matches
        .filter((m) => m.teamAId === teamId || m.teamBId === teamId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data.matches, teamId],
  )

  const leaderboard = useMemo(() => buildScoringLeaderboard(roster, data.matches), [roster, data.matches])

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-slate-400">Команда не найдена.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-10">
          <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8">
            <ArrowLeft className="h-4 w-4" /> К группам
          </Link>

          <div className="flex items-center gap-5">
            <TeamLogo team={team} size="2xl" shape="square" className="!h-20 !w-20 border-0" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-black italic uppercase text-white leading-none">{team.name}</h1>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-slate-400">Группа {team.group}</span>
              </div>
              <div className="mt-3">
                <FormBadges teamId={team.id} matches={data.matches} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
        <section>
          <h2 className="text-xl font-black italic uppercase text-white mb-2">Состав ({roster.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            {roster.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        </section>

        {leaderboard.length > 0 && (
          <section>
            <h2 className="text-xl font-black italic uppercase text-white mb-2">Статистика очков</h2>
            <div className="divide-y divide-slate-800/70 border-t border-slate-800/70">
              {leaderboard.map((row) => (
                <div key={row.player.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-300">{row.player.fullName}</span>
                  <span className="font-black text-court-400 tabular-nums">{row.totalPoints}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-black italic uppercase text-white mb-2">История матчей</h2>
          {teamMatches.length === 0 && <p className="text-slate-500 text-sm">Матчей ещё не было.</p>}
          <div className="flex flex-col">
            {teamMatches.map((m) => (
              <MatchRow key={m.id} match={m} teamA={teamsMap.get(m.teamAId)} teamB={teamsMap.get(m.teamBId)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
