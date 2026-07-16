// Контекст с данными турнира: общий бэкенд на Railway, не localStorage —
// читается один раз при загрузке, обновляется polling'ом, пишется явно через setData
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadData, resetToSeed, saveData } from '../data/store'
import type { TournamentData } from '../types'

const POLL_INTERVAL_MS = 8000

interface TournamentContextValue {
  data: TournamentData
  setData: (updater: (d: TournamentData) => TournamentData) => Promise<void>
  resetTournament: () => Promise<void>
}

const TournamentContext = createContext<TournamentContextValue | null>(null)

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<TournamentData | null>(null)

  useEffect(() => {
    loadData().then(setDataState)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      loadData().then(setDataState)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const setData = async (updater: (d: TournamentData) => TournamentData) => {
    if (!data) return
    const updated = updater(data)
    setDataState(updated)
    try {
      await saveData(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось сохранить изменения.')
      setDataState(data)
    }
  }

  const resetTournament = async () => {
    const seed = resetToSeed()
    setDataState(seed)
    try {
      await saveData(seed)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось сохранить изменения.')
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Загрузка турнира…
      </div>
    )
  }

  return (
    <TournamentContext.Provider value={{ data, setData, resetTournament }}>
      {children}
    </TournamentContext.Provider>
  )
}

export function useTournamentData() {
  const ctx = useContext(TournamentContext)
  if (!ctx) throw new Error('useTournamentData должен использоваться внутри TournamentProvider')
  return ctx
}
