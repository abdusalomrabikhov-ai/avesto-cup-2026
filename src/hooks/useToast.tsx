// Глобальный тост: подтверждение успешного сохранения/добавления/изменения в админке
import { createContext, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

const ToastContext = createContext<((message: string) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {message && (
        <div className="safe-bottom fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 border border-court-500/40 text-court-400 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast должен использоваться внутри ToastProvider')
  return ctx
}
