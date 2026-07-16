import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'

interface Props {
  login: (password: string) => Promise<boolean>
}

export function AdminLoginPage({ login }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!(await login(password))) {
      setError('Неверный пароль')
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2 justify-center text-slate-300">
          <Lock className="h-5 w-5" />
          <h1 className="font-semibold text-lg text-white">Вход в админ-панель</h1>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          placeholder="Пароль"
          className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-court-500"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          className="bg-court-500 hover:bg-court-400 text-slate-950 font-semibold rounded-md px-3 py-2 text-sm transition-colors"
        >
          Войти
        </button>
      </form>
    </div>
  )
}
