import { useCallback, useEffect, useState } from 'react'
import { loadStats, resetStats } from '../../data/store'
import type { VisitStats } from '../../data/store'
import { useConfirm } from '../../hooks/useConfirm'

const PAGE_LABELS: Record<string, string> = {
  '/': 'Главная',
  '/teams': 'Команды',
  '/teams/:id': 'Карточка команды',
  '/groups': 'Группы',
  '/bracket': 'Плей-офф',
  '/matches': 'Матчи',
  '/players': 'Игроки',
  '/players/:id': 'Карточка игрока',
  '/awards': 'Номинации',
}

const formatDay = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

export function AdminStatsPage() {
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const confirm = useConfirm()

  const refresh = useCallback(() => {
    loadStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(refresh, [refresh])

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Сбросить статистику посещаемости?',
      description:
        'Все накопленные данные о посещениях будут удалены безвозвратно: счётчики обнулятся и начнут считаться заново. На данные турнира это не влияет.',
      confirmLabel: 'Сбросить',
    })
    if (!ok) return
    try {
      await resetStats()
      refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!stats) return <p className="text-sm text-slate-400">Загрузка статистики…</p>

  const today = stats.daily[0]

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-white mb-4">Посещаемость</h1>

      <div className="grid grid-cols-2 gap-3 mb-10">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-3xl font-black text-court-400">{stats.total.visitors}</div>
          <div className="text-sm text-slate-400 mt-1">Уникальных за всё время</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="text-3xl font-black text-white">{today?.visitors ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">Уникальных сегодня</div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">По дням</h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden mb-10">
        {stats.daily.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">Пока нет данных.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="text-left font-medium px-4 py-2">Дата</th>
                <th className="text-right font-medium px-4 py-2">Уникальных</th>
                <th className="text-right font-medium px-4 py-2">Просмотров</th>
              </tr>
            </thead>
            <tbody>
              {stats.daily.map((d) => (
                <tr key={d.date} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-2 text-slate-200">{formatDay(d.date)}</td>
                  <td className="px-4 py-2 text-right text-court-400 font-semibold">{d.visitors}</td>
                  <td className="px-4 py-2 text-right text-slate-400">{d.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Популярные разделы</h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {stats.pages.length === 0 ? (
          <p className="text-sm text-slate-400 p-4">Пока нет данных.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="text-left font-medium px-4 py-2">Раздел</th>
                <th className="text-right font-medium px-4 py-2">Уникальных</th>
                <th className="text-right font-medium px-4 py-2">Просмотров</th>
              </tr>
            </thead>
            <tbody>
              {stats.pages.map((p) => (
                <tr key={p.path} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-2 text-slate-200">{PAGE_LABELS[p.path] ?? p.path}</td>
                  <td className="px-4 py-2 text-right text-slate-300">{p.visitors}</td>
                  <td className="px-4 py-2 text-right text-slate-400">{p.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Считаются устройства, а не люди: один человек с телефона и ноутбука — два уникальных посетителя. Заходы в
        админку не учитываются.
      </p>

      <h2 className="text-xl font-bold text-white mb-4 mt-10">Сброс</h2>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
        <p className="text-sm text-slate-400">
          Обнулить счётчики и начать подсчёт заново — например, чтобы убрать тестовые заходы перед стартом турнира.
          Данные турнира не затрагиваются.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="self-start px-3 py-2 text-sm font-semibold rounded-md border border-slate-800 text-slate-300 hover:border-red-400 hover:text-red-400 transition-colors"
        >
          Сбросить статистику
        </button>
      </div>
    </div>
  )
}
