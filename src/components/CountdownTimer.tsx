import { useEffect, useState } from 'react'
import { getCountdownParts } from '../lib/countdown'

const UNITS: { key: 'days' | 'hours' | 'minutes' | 'seconds'; label: string }[] = [
  { key: 'days', label: 'Дней' },
  { key: 'hours', label: 'Часов' },
  { key: 'minutes', label: 'Минут' },
  { key: 'seconds', label: 'Секунд' },
]

// Ремоунт по значению запускает CSS-анимацию появления при каждой смене цифры (см. countdown-tick в index.css)
function AnimatedDigits({ value }: { value: string }) {
  return (
    <span key={value} className="countdown-tick text-3xl sm:text-6xl font-black italic text-white tabular-nums leading-none">
      {value}
    </span>
  )
}

export function CountdownTimer({ targetDateTime }: { targetDateTime: string }) {
  const [parts, setParts] = useState(() => getCountdownParts(targetDateTime))

  useEffect(() => {
    const id = setInterval(() => setParts(getCountdownParts(targetDateTime)), 1000)
    return () => clearInterval(id)
  }, [targetDateTime])

  if (parts.isPast) {
    return <p className="text-slate-400 text-sm">Событие уже началось.</p>
  }

  return (
    <div className="flex flex-wrap justify-center divide-x divide-slate-700">
      {UNITS.map((u) => (
        <div key={u.key} className="flex flex-col items-center gap-2 px-3 sm:px-10 first:pl-0 last:pr-0 overflow-hidden">
          <AnimatedDigits value={String(parts[u.key]).padStart(2, '0')} />
          <span className="text-slate-500 text-xs uppercase tracking-wide">{u.label}</span>
        </div>
      ))}
    </div>
  )
}
