import { useMemo } from 'react'
import { useTournamentData } from '../../hooks/useTournamentData'
import { useToast } from '../../hooks/useToast'
import { buildScoringLeaderboard } from '../../lib/scorers'
import { AWARD_LABELS } from '../../types'
import type { AwardType } from '../../types'

const AWARD_TYPES: AwardType[] = ['mvp', 'best_defender', 'top_scorer']

export function AdminAwardsPage() {
  const { data, setData } = useTournamentData()
  const showToast = useToast()
  const leaderboard = useMemo(() => buildScoringLeaderboard(data.players, data.matches), [data.players, data.matches])
  const topScorerId = leaderboard[0]?.player.id

  const setAward = (type: AwardType, playerId: string) => {
    setData((d) => ({
      ...d,
      awards: d.awards.map((a) => (a.type === type ? { ...a, playerId: playerId || null } : a)),
    }))
    showToast('Награда сохранена')
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white mb-4">Индивидуальные номинации</h1>
      <div className="flex flex-col gap-4">
        {AWARD_TYPES.map((type) => {
          const current = data.awards.find((a) => a.type === type)
          return (
            <div key={type} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <label className="text-sm font-medium text-slate-200 block mb-2">{AWARD_LABELS[type]}</label>
              <select
                value={current?.playerId ?? ''}
                onChange={(e) => setAward(type, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
              >
                <option value="">Не назначено</option>
                {data.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                    {type === 'top_scorer' && p.id === topScorerId ? ' (лидер рейтинга)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
