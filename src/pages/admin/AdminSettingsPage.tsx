import { useTournamentData } from '../../hooks/useTournamentData'
import { useConfirm } from '../../hooks/useConfirm'
import { rebuildGroupSchedule } from '../../data/store'
import { COUNTDOWN_MODE_LABELS } from '../../types'
import type { CountdownMode } from '../../types'

const MODES: CountdownMode[] = ['tournament_start', 'final']

export function AdminSettingsPage() {
  const { data, setData, resetTournament } = useTournamentData()
  const confirm = useConfirm()
  const { countdown } = data

  const setMode = (mode: CountdownMode) => {
    setData((d) => ({ ...d, countdown: { ...d.countdown, mode } }))
  }

  const setTournamentStart = (value: string) => {
    setData((d) => ({ ...d, countdown: { ...d.countdown, tournamentStart: value } }))
  }

  const setFinal = (value: string) => {
    setData((d) => ({ ...d, countdown: { ...d.countdown, final: value } }))
  }

  const handleRebuildSchedule = async () => {
    const ok = await confirm({
      title: 'Пересобрать расписание группового этапа?',
      description:
        'Все текущие матчи и введённые результаты группового этапа будут заменены новым календарём. Команды, логотипы и составы не изменятся.',
      confirmLabel: 'Пересобрать',
    })
    if (!ok) return
    setData((d) => rebuildGroupSchedule(d))
  }

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Сбросить турнир к исходным данным?',
      description:
        'Все текущие результаты матчей, составы, награды будут заменены исходным набором данных из кода. Используется для первого запуска на новом сервере.',
      confirmLabel: 'Сбросить',
    })
    if (!ok) return
    await resetTournament()
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-white mb-4">Обратный отсчёт на главной</h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-4">
        <label className="text-sm font-medium text-slate-200 block">Что отсчитываем</label>
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 px-3 py-2 text-sm font-semibold rounded-md border transition-colors ${
                countdown.mode === m
                  ? 'bg-court-500/15 border-court-400 text-court-400'
                  : 'border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {COUNTDOWN_MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <label className="text-sm text-slate-400 flex flex-col gap-1">
          Дата и время начала турнира
          <input
            type="datetime-local"
            value={countdown.tournamentStart}
            onChange={(e) => setTournamentStart(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
          />
        </label>

        <label className="text-sm text-slate-400 flex flex-col gap-1">
          Дата и время финала
          <input
            type="datetime-local"
            value={countdown.final}
            onChange={(e) => setFinal(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100"
          />
        </label>

        <p className="text-xs text-slate-500">
          На главной странице отображается обратный отсчёт до выбранного события. Переключите режим на «До финала»,
          когда групповой этап и плей-офф начнутся.
        </p>
      </div>

      <h2 className="text-xl font-bold text-white mb-4 mt-10">Расписание группового этапа</h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
        <p className="text-sm text-slate-400">
          Пересчитать даты и пары матчей группового этапа заново. Команды, логотипы и составы не затрагиваются —
          заменяются только сами матчи.
        </p>
        <button
          type="button"
          onClick={handleRebuildSchedule}
          className="self-start px-3 py-2 text-sm font-semibold rounded-md border border-slate-800 text-slate-300 hover:border-court-400 hover:text-court-400 transition-colors"
        >
          Пересобрать расписание
        </button>
      </div>

      <h2 className="text-xl font-bold text-white mb-4 mt-10">Сброс данных</h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
        <p className="text-sm text-slate-400">
          Заменить все данные турнира (команды, матчи, составы, награды) исходным набором из кода. Нужно один раз
          после первого деплоя на новый сервер, чтобы наполнить базу данных.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="self-start px-3 py-2 text-sm font-semibold rounded-md border border-red-900/50 text-red-400 hover:border-red-500 hover:text-red-300 transition-colors"
        >
          Сбросить к исходным данным
        </button>
      </div>
    </div>
  )
}
