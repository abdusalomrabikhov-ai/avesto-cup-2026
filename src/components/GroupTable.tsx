import type { GroupId, StandingsRow } from '../types'
import { TeamBadge } from './TeamBadge'

interface Props {
  group: GroupId
  rows: StandingsRow[]
}

export function GroupTable({ group, rows }: Props) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-black italic text-xl text-white">Группа {group}</h2>
        <span className="text-xs text-slate-500">Топ-2 в плей-офф</span>
      </div>
      <div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-slate-500 text-[11px] uppercase tracking-wide">
              <th className="pb-2 text-left font-medium w-8"></th>
              <th className="pb-2 text-left font-medium">Команда</th>
              <th className="pb-2 text-center font-medium">И</th>
              <th className="pb-2 text-center font-medium">В</th>
              <th className="pb-2 text-center font-medium">П</th>
              <th className="pb-2 text-center font-medium hidden sm:table-cell">ЗО</th>
              <th className="pb-2 text-center font-medium hidden sm:table-cell">ПО</th>
              <th className="pb-2 text-center font-medium">±</th>
              <th className="pb-2 text-right font-medium">Очки</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.team.id}
                className={`border-t border-slate-800/70 ${row.qualifiesForPlayoff ? 'border-l-2 border-l-court-400' : ''}`}
              >
                <td className="py-3 pl-2 sm:pl-3 text-slate-500 tabular-nums text-xs">{idx + 1}</td>
                <td className="py-3 w-full max-w-0 pr-2">
                  <TeamBadge team={row.team} size="sm" />
                </td>
                <td className="py-3 text-center text-slate-400 tabular-nums">{row.played}</td>
                <td className="py-3 text-center text-slate-400 tabular-nums">{row.wins}</td>
                <td className="py-3 text-center text-slate-400 tabular-nums">{row.losses}</td>
                <td className="py-3 text-center text-slate-500 tabular-nums hidden sm:table-cell">{row.scored}</td>
                <td className="py-3 text-center text-slate-500 tabular-nums hidden sm:table-cell">{row.conceded}</td>
                <td
                  className={`py-3 text-center tabular-nums font-medium ${row.diff > 0 ? 'text-court-400' : row.diff < 0 ? 'text-red-400' : 'text-slate-500'}`}
                >
                  {row.diff > 0 ? '+' : ''}
                  {row.diff}
                </td>
                <td className="py-3 text-right font-black text-lg text-white tabular-nums pr-1">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
