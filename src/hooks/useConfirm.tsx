// Кастомное окно подтверждения в стиле сайта — замена нативному confirm()
import { createContext, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null)

  const confirm: ConfirmFn = (options) =>
    new Promise((resolve) => {
      setState({ options, resolve })
    })

  const close = (result: boolean) => {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="shrink-0 h-9 w-9 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="h-4.5 w-4.5 text-red-400" />
              </span>
              <div>
                <h2 className="font-semibold text-white">{state.options.title}</h2>
                {state.options.description && (
                  <p className="text-sm text-slate-400 mt-1">{state.options.description}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="px-3 py-2 text-sm font-semibold rounded-md bg-red-500 hover:bg-red-400 text-white transition-colors"
              >
                {state.options.confirmLabel ?? 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm должен использоваться внутри ConfirmProvider')
  return ctx
}
