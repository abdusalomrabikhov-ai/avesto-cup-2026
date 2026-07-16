import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { useTournamentData } from '../hooks/useTournamentData'
import { buildBracket, resolveMatchWinner } from '../lib/playoff'
import { BracketMatchCard } from '../components/BracketMatchCard'
import { TeamLogo } from '../components/TeamLogo'
import type { MatchStage } from '../types'

const STAGE_DATE_LABELS: { stage: MatchStage; label: string }[] = [
  { stage: 'quarterfinal', label: '1/4 финала' },
  { stage: 'semifinal', label: 'Полуфинал' },
  { stage: 'third_place', label: 'Матч за 3-е место' },
  { stage: 'final', label: 'Финал' },
]

function formatShortDate(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function BracketPage() {
  const { data } = useTournamentData()
  const teamsMap = useMemo(() => new Map(data.teams.map((t) => [t.id, t])), [data.teams])
  const bracket = useMemo(
    () => buildBracket(data.teams, data.matches, data.drawLots),
    [data.teams, data.matches, data.drawLots],
  )

  const championId = bracket.final.match ? resolveMatchWinner(bracket.final.match) : null
  const champion = championId ? teamsMap.get(championId) : undefined

  // Дата каждой стадии плей-офф — самая ранняя среди уже созданных матчей этой
  // стадии (пары могут быть ещё не определены группами, но дата уже назначена)
  const stageDates = useMemo(() => {
    return STAGE_DATE_LABELS.map(({ stage, label }) => {
      const dates = data.matches.filter((m) => m.stage === stage).map((m) => m.date).sort()
      return { label, date: dates[0] ?? null }
    })
  }, [data.matches])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black italic uppercase text-white">Сетка плей-офф</h1>
        <p className="text-slate-500 text-sm mt-2">
          1/4 финала, полуфиналы, матч за 3-е место и финал. При ничьей: овертайм 5 минут.
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-visible pb-4">
        <div className="relative flex gap-3 min-w-max px-1">
          {/* 1/4 финала: две пары карточек, каждая пара — общий bracket-коннектор к своему полуфиналу */}
          <div className="flex flex-col gap-16">
            {[0, 1].map((pairIdx) => (
              <div key={pairIdx} className="flex gap-3">
                <div className="flex flex-col gap-6">
                  <BracketMatchCard slot={bracket.quarterfinals[pairIdx * 2]} teams={teamsMap} label="1/4 финала" />
                  <BracketMatchCard slot={bracket.quarterfinals[pairIdx * 2 + 1]} teams={teamsMap} label="1/4 финала" />
                </div>
                <div className="w-8 shrink-0 flex flex-col justify-center">
                  <div className="h-1/2 border-r border-b border-slate-500 rounded-br" />
                  <div className="h-1/2 border-r border-t border-slate-500 rounded-tr" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-around gap-16 py-10">
            {bracket.semifinals.map((sf) => (
              <BracketMatchCard key={sf.slot} slot={sf} teams={teamsMap} label="Полуфинал" />
            ))}
          </div>

          {/* Коннектор SF -> Финал: скобка на всю высоту сетки (обе пары QF), сходится
              в одной точке на уровне Финала — путь виден целиком, а не только между SF */}
          <div className="w-8 shrink-0 flex flex-col justify-center">
            <div className="h-1/2 border-r border-b border-slate-500 rounded-br" />
            <div className="h-1/2 border-r border-t border-slate-500 rounded-tr" />
          </div>

          {/* Финал прибит к вертикальному центру всей сетки (не только SF-колонки);
              матч за 3-е место — отдельно, у нижней пары четвертьфиналов */}
          <div className="relative w-56 shrink-0">
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-56">
              <BracketMatchCard slot={bracket.final} teams={teamsMap} label="Финал" />
            </div>
            <div className="absolute bottom-0 left-0 w-56">
              <BracketMatchCard slot={bracket.thirdPlace} teams={teamsMap} label="Матч за 3-е место" />
            </div>
          </div>

          <div className="w-8 shrink-0 flex items-center">
            <div className="w-full h-px bg-slate-500" />
          </div>

          <div className="flex flex-col justify-center">
            <div className="w-56 shrink-0 border border-gold-400/40 bg-gold-400/[0.06] flex flex-col items-center gap-3 p-6 text-center">
              <Trophy className="h-8 w-8 text-gold-400" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Чемпион турнира</span>
              {champion ? (
                <>
                  <TeamLogo team={champion} size="xl" />
                  <span className="font-black uppercase text-white">{champion.name}</span>
                </>
              ) : (
                <span className="text-slate-600 text-sm italic">TBD</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {stageDates.some((s) => s.date) && (
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-700 pt-6">
          {stageDates.map(({ label, date }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
              <span className={`text-sm font-semibold ${date ? 'text-white' : 'text-slate-600 italic'}`}>
                {date ? formatShortDate(date) : 'TBD'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
