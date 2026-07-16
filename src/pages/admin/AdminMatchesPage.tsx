import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useTournamentData } from '../../hooks/useTournamentData'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import { formatDate } from '../../lib/formatDate'
import { MATCH_STAGE_LABELS, MATCH_STATUS_LABELS } from '../../types'
import type { GroupId, Match, MatchStage } from '../../types'

const GROUPS: GroupId[] = ['A', 'B', 'C', 'D']
const STAGES: MatchStage[] = ['group', 'quarterfinal', 'semifinal', 'third_place', 'final']
const PLAYOFF_STAGES: MatchStage[] = ['quarterfinal', 'semifinal', 'third_place', 'final']

type StageTab = 'group' | 'playoff'

const STAGE_TABS: { value: StageTab; label: string }[] = [
  { value: 'group', label: 'Групповой этап' },
  { value: 'playoff', label: 'Плей-офф' },
]

export function AdminMatchesPage() {
  const { data, setData } = useTournamentData()
  const showToast = useToast()
  const confirm = useConfirm()
  const [stageTab, setStageTab] = useState<StageTab>('group')
  const [stage, setStage] = useState<MatchStage>('group')
  const [group, setGroup] = useState<GroupId>('A')
  const [teamAId, setTeamAId] = useState('')
  const [teamBId, setTeamBId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const availableTeams = useMemo(
    () => (stage === 'group' ? data.teams.filter((t) => t.group === group) : data.teams),
    [data.teams, stage, group],
  )

  const teamsMap = useMemo(() => new Map(data.teams.map((t) => [t.id, t])), [data.teams])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!teamAId || !teamBId || teamAId === teamBId || !date) return

    // Защита от рассинхронизации состояния формы: не даём создать матч между
    // командами из разных групп на групповом этапе
    if (stage === 'group') {
      const teamA = teamsMap.get(teamAId)
      const teamB = teamsMap.get(teamBId)
      if (teamA?.group !== group || teamB?.group !== group) return
    }

    const newMatch: Match = {
      id: crypto.randomUUID(),
      stage,
      group: stage === 'group' ? group : null,
      date,
      time: time || undefined,
      teamAId,
      teamBId,
      scoreA: null,
      scoreB: null,
      status: 'scheduled',
      isForfeit: false,
      overtimes: [],
      playerStats: [],
    }
    setData((d) => ({ ...d, matches: [...d.matches, newMatch] }))
    setTeamAId('')
    setTeamBId('')
    setDate('')
    setTime('')
    showToast('Матч создан')
  }

  const handleDelete = async (matchId: string) => {
    const ok = await confirm({ title: 'Удалить матч?', description: 'Это действие необратимо.' })
    if (!ok) return
    setData((d) => ({ ...d, matches: d.matches.filter((m) => m.id !== matchId) }))
  }

  const sortedMatches = [...data.matches]
    .filter((m) => (stageTab === 'group' ? m.stage === 'group' : PLAYOFF_STAGES.includes(m.stage)))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      <div>
        <h1 className="text-xl font-bold text-white mb-4">Матчи ({data.matches.length})</h1>

        <div className="flex gap-1 mb-4 border-b border-slate-800">
          {STAGE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStageTab(tab.value)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                stageTab === tab.value
                  ? 'border-court-400 text-court-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {sortedMatches.length === 0 && (
          <p className="text-sm text-slate-500 mb-4">Матчей пока нет.</p>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
          {sortedMatches.map((m) => {
            const teamA = teamsMap.get(m.teamAId)
            const teamB = teamsMap.get(m.teamBId)
            const isCrossGroup = m.stage === 'group' && teamA && teamB && teamA.group !== teamB.group
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
                <Link to={`/admin/matches/${m.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs text-slate-500 w-24 shrink-0">
                    {formatDate(m.date)}
                    {m.time && <span className="block text-slate-600">{m.time}</span>}
                  </span>
                  <span className="flex-1 text-sm text-slate-200 truncate">
                    {teamA?.name ?? '?'} vs {teamB?.name ?? '?'}
                    {isCrossGroup && (
                      <span className="ml-2 text-xs text-red-400" title="Команды из разных групп">
                        ⚠ разные группы
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">{MATCH_STAGE_LABELS[m.stage]}</span>
                  <span className="font-mono text-sm text-slate-300 w-16 text-right">
                    {m.scoreA != null ? `${m.scoreA}:${m.scoreB}` : '—'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                    {MATCH_STATUS_LABELS[m.status]}
                  </span>
                </Link>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Удалить матч"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3 h-fit sticky top-20"
      >
        <h2 className="font-semibold text-white flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Новый матч
        </h2>
        <label className="flex items-center justify-between text-sm text-slate-300">
          Стадия
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value as MatchStage)
              setTeamAId('')
              setTeamBId('')
            }}
            className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {MATCH_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        {stage === 'group' && (
          <label className="flex items-center justify-between text-sm text-slate-300">
            Группа
            <select
              value={group}
              onChange={(e) => {
                setGroup(e.target.value as GroupId)
                setTeamAId('')
                setTeamBId('')
              }}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5"
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        )}
        <select
          value={teamAId}
          onChange={(e) => setTeamAId(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
          required
        >
          <option value="">Команда A</option>
          {availableTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={teamBId}
          onChange={(e) => setTeamBId(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
          required
        >
          <option value="">Команда B</option>
          {availableTeams.filter((t) => t.id !== teamAId).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
            required
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <button
          type="submit"
          className="bg-court-500 hover:bg-court-400 text-slate-950 font-semibold rounded-md px-3 py-2 text-sm transition-colors"
        >
          Создать
        </button>
      </form>
    </div>
  )
}
