import { useMemo, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useTournamentData } from '../../hooks/useTournamentData'
import { useToast } from '../../hooks/useToast'
import { applyForfeitScore } from '../../lib/forfeit'
import { MATCH_STATUS_LABELS } from '../../types'
import type { Overtime, MatchStatus, PlayerMatchStat } from '../../types'

const MANUAL_STATUSES: MatchStatus[] = ['scheduled', 'finished']

const PLAYOFF_STAGES = new Set(['quarterfinal', 'semifinal', 'third_place', 'final'])

export function AdminMatchResultPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const showToast = useToast()
  const { data, setData } = useTournamentData()

  const match = data.matches.find((m) => m.id === matchId)
  const teamA = match ? data.teams.find((t) => t.id === match.teamAId) : undefined
  const teamB = match ? data.teams.find((t) => t.id === match.teamBId) : undefined
  const rosterA = useMemo(() => data.players.filter((p) => p.teamId === match?.teamAId), [data.players, match])
  const rosterB = useMemo(() => data.players.filter((p) => p.teamId === match?.teamBId), [data.players, match])

  const [date, setDate] = useState(match?.date ?? '')
  const [time, setTime] = useState(match?.time ?? '')
  const [status, setStatus] = useState<MatchStatus>(match?.status ?? 'scheduled')
  const [scoreA, setScoreA] = useState(match?.scoreA?.toString() ?? '')
  const [scoreB, setScoreB] = useState(match?.scoreB?.toString() ?? '')
  const [isForfeit, setIsForfeit] = useState(match?.isForfeit ?? false)
  const [forfeitLoserId, setForfeitLoserId] = useState(match?.forfeitLoserId ?? '')
  const [overtimes, setOvertimes] = useState<Overtime[]>(match?.overtimes ?? [])
  const [playerStats, setPlayerStats] = useState<Map<string, number>>(
    new Map((match?.playerStats ?? []).map((s) => [s.playerId, s.points])),
  )

  if (!match || !teamA || !teamB) {
    return (
      <div>
        <p className="text-slate-400">Матч не найден.</p>
      </div>
    )
  }

  const isPlayoff = PLAYOFF_STAGES.has(match.stage)

  const addOvertime = () => {
    setOvertimes((ots) => [...ots, { index: ots.length + 1, scoreA: 0, scoreB: 0 }])
  }
  const updateOvertime = (idx: number, field: 'scoreA' | 'scoreB', value: number) => {
    setOvertimes((ots) => ots.map((ot, i) => (i === idx ? { ...ot, [field]: value } : ot)))
  }
  const removeOvertime = (idx: number) => {
    setOvertimes((ots) => ots.filter((_, i) => i !== idx).map((ot, i) => ({ ...ot, index: i + 1 })))
  }

  const setPlayerPoints = (playerId: string, points: number) => {
    setPlayerStats((prev) => {
      const next = new Map(prev)
      if (points > 0) next.set(playerId, points)
      else next.delete(playerId)
      return next
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const statsArr: PlayerMatchStat[] = [...playerStats.entries()].map(([playerId, points]) => ({ playerId, points }))

    setData((d) => ({
      ...d,
      matches: d.matches.map((m) => {
        if (m.id !== match.id) return m

        if (isForfeit && forfeitLoserId) {
          return { ...applyForfeitScore(m, forfeitLoserId), date, time: time || undefined, overtimes, playerStats: statsArr }
        }

        return {
          ...m,
          date,
          time: time || undefined,
          scoreA: scoreA === '' ? null : Number(scoreA),
          scoreB: scoreB === '' ? null : Number(scoreB),
          status,
          isForfeit: false,
          forfeitLoserId: undefined,
          overtimes,
          playerStats: statsArr,
        }
      }),
    }))

    showToast('Результат сохранён')
    navigate('/admin/matches')
  }

  return (
    <div className="max-w-3xl">
      <Link to="/admin/matches" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> К матчам
      </Link>

      <h1 className="text-xl font-bold text-white mb-1">
        {teamA.name} vs {teamB.name}
      </h1>
      <p className="text-sm text-slate-500 mb-6">Группа {match.group ?? '—'}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <label className="flex items-center justify-between text-sm text-slate-300 mb-4">
            Дата матча
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-slate-100"
                required
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-slate-100"
              />
            </div>
          </label>

          {!isForfeit && (
            <label className="flex items-center justify-between text-sm text-slate-300 mb-4">
              Статус матча
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MatchStatus)}
                className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5"
              >
                {MANUAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {MATCH_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-300 mb-3">
            <input
              type="checkbox"
              checked={isForfeit}
              onChange={(e) => {
                setIsForfeit(e.target.checked)
                if (e.target.checked) setStatus('forfeit')
                else setStatus(scoreA !== '' && scoreB !== '' ? 'finished' : 'scheduled')
              }}
            />
            Неявка (техническое поражение, авто-счёт 0:20)
          </label>

          {isForfeit ? (
            <select
              value={forfeitLoserId}
              onChange={(e) => setForfeitLoserId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
              required
            >
              <option value="">Кто не явился?</option>
              <option value={teamA.id}>{teamA.name}</option>
              <option value={teamB.id}>{teamB.name}</option>
            </select>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex flex-col gap-1 text-xs text-slate-400 flex-1">
                {teamA.name}
                <input
                  type="number"
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-lg font-mono text-slate-100"
                />
              </label>
              <span className="text-slate-500 mt-4">:</span>
              <label className="flex flex-col gap-1 text-xs text-slate-400 flex-1">
                {teamB.name}
                <input
                  type="number"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-lg font-mono text-slate-100"
                />
              </label>
            </div>
          )}
        </div>

        {isPlayoff && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white text-sm">Овертаймы (при ничьей, по 5 минут)</h2>
              <button
                type="button"
                onClick={addOvertime}
                className="flex items-center gap-1 text-xs text-court-400 hover:text-court-400"
              >
                <Plus className="h-3.5 w-3.5" /> Добавить
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {overtimes.map((ot, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-16">ОТ {ot.index}</span>
                  <input
                    type="number"
                    value={ot.scoreA}
                    onChange={(e) => updateOvertime(idx, 'scoreA', Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-sm w-20 font-mono text-slate-100"
                  />
                  <span className="text-slate-500">:</span>
                  <input
                    type="number"
                    value={ot.scoreB}
                    onChange={(e) => updateOvertime(idx, 'scoreB', Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-sm w-20 font-mono text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeOvertime(idx)}
                    className="min-h-11 min-w-11 flex items-center justify-center text-red-400/70 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {overtimes.length === 0 && <p className="text-xs text-slate-500">Овертаймов нет.</p>}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h2 className="font-semibold text-white text-sm mb-3">Очки игроков (опционально)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: teamA.name, roster: rosterA },
              { label: teamB.name, roster: rosterB },
            ].map(({ label, roster }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-2">{label}</p>
                <div className="flex flex-col gap-1.5">
                  {roster.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-sm text-slate-300 flex-1 truncate">
                        №{p.number} {p.fullName}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={playerStats.get(p.id) ?? ''}
                        onChange={(e) => setPlayerPoints(p.id, Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-sm w-16 font-mono text-slate-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-court-500 hover:bg-court-400 text-slate-950 font-semibold rounded-md px-4 py-2.5 text-sm transition-colors self-start"
        >
          Сохранить результат
        </button>
      </form>
    </div>
  )
}
