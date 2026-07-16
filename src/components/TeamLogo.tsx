import type { Team } from '../types'

const SIZES = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-16 w-16',
  '2xl': 'h-28 w-28',
}

interface Props {
  team: Team
  size?: keyof typeof SIZES
  shape?: 'circle' | 'square'
  className?: string
}

// Единая иконка команды: один и тот же относительный padding для всех логотипов,
// чтобы визуальный вес не зависел от внутренних полей исходного файла
export function TeamLogo({ team, size = 'md', shape = 'circle', className = '' }: Props) {
  return (
    <span
      className={`${SIZES[size]} shrink-0 ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-white border border-slate-700 flex items-center justify-center overflow-hidden ${className}`}
    >
      {team.logo ? (
        <img src={team.logo} alt={team.name} className="h-[80%] w-[80%] object-contain" />
      ) : (
        <span className="text-xs font-bold text-slate-500">{team.name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  )
}
