import type { Match, Team } from '../types'
import { TeamLogo } from './TeamLogo'

interface Props {
  teams: Team[]
  matches: Match[]
}

function findResult(rowTeamId: string, colTeamId: string, matches: Match[]) {
  const m = matches.find(
    (x) =>
      x.stage === 'group' &&
      x.scoreA != null &&
      x.scoreB != null &&
      ((x.teamAId === rowTeamId && x.teamBId === colTeamId) || (x.teamAId === colTeamId && x.teamBId === rowTeamId)),
  )
  if (!m) return null

  let scoreOwn = m.teamAId === rowTeamId ? m.scoreA! : m.scoreB!
  let scoreOpp = m.teamAId === rowTeamId ? m.scoreB! : m.scoreA!
  for (const ot of m.overtimes) {
    scoreOwn += m.teamAId === rowTeamId ? ot.scoreA : ot.scoreB
    scoreOpp += m.teamAId === rowTeamId ? ot.scoreB : ot.scoreA
  }

  return { scoreOwn, scoreOpp, won: scoreOwn > scoreOpp }
}

// Матрица очных встреч «каждый с каждым» внутри одной группы: строка — своя
// команда, столбец — соперник, ячейка — счёт с точки зрения строки
export function HeadToHeadMatrix({ teams, matches }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border-hidden">
        <thead>
          <tr>
            <th className="w-16" />
            {teams.map((t) => (
              <th key={t.id} className="border border-slate-600 px-3 py-3">
                <div className="flex justify-center">
                  <TeamLogo team={t} size="md" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((rowTeam) => (
            <tr key={rowTeam.id}>
              <td className="border border-slate-600 px-3 py-3">
                <div className="flex justify-center">
                  <TeamLogo team={rowTeam} size="md" />
                </div>
              </td>
              {teams.map((colTeam) => {
                if (colTeam.id === rowTeam.id) {
                  return (
                    <td key={colTeam.id} className="border border-slate-600 text-center text-slate-700 px-3 text-lg">
                      —
                    </td>
                  )
                }
                const result = findResult(rowTeam.id, colTeam.id, matches)
                return (
                  <td key={colTeam.id} className="border border-slate-600 text-center px-3 tabular-nums font-mono text-base">
                    {result ? (
                      <span className={`font-bold ${result.won ? 'text-court-400' : 'text-red-400'}`}>
                        {result.scoreOwn}:{result.scoreOpp}
                      </span>
                    ) : (
                      <span className="text-slate-700 text-lg">·</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
