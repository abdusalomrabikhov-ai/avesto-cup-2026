import { useMemo } from 'react'
import { useTournamentData } from '../hooks/useTournamentData'
import { buildGroupStandings } from '../lib/standings'
import { GroupTable } from '../components/GroupTable'
import { HeadToHeadMatrix } from '../components/HeadToHeadMatrix'
import type { GroupId } from '../types'

const GROUPS: GroupId[] = ['A', 'B', 'C', 'D']

export function GroupsPage() {
  const { data } = useTournamentData()

  const standingsByGroup = useMemo(
    () =>
      Object.fromEntries(
        GROUPS.map((g) => [g, buildGroupStandings(g, data.teams, data.matches, data.drawLots)]),
      ) as Record<GroupId, ReturnType<typeof buildGroupStandings>>,
    [data.teams, data.matches, data.drawLots],
  )

  const teamsByGroup = useMemo(
    () => Object.fromEntries(GROUPS.map((g) => [g, data.teams.filter((t) => t.group === g)])) as Record<GroupId, typeof data.teams>,
    [data.teams],
  )

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black italic uppercase text-white">Групповой этап</h1>
          <p className="text-slate-500 text-sm mt-2">
            Круговая система «каждый с каждым». Топ-2 каждой группы выходят в плей-офф.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12">
          {GROUPS.map((g) => (
            <GroupTable key={g} group={g} rows={standingsByGroup[g]} />
          ))}
        </div>
      </div>

      <div className="mt-16 border-t border-slate-700 bg-slate-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-black italic uppercase text-white mb-2">Очные встречи</h2>
          <p className="text-slate-500 text-sm mb-10">Результаты всех сыгранных матчей группового этапа, по группам.</p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-16 gap-y-16">
            {GROUPS.map((g) => (
              <div key={g}>
                <h3 className="font-black italic text-xl text-white mb-4">Группа {g}</h3>
                <HeadToHeadMatrix teams={teamsByGroup[g]} matches={data.matches} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
