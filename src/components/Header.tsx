import { NavLink } from 'react-router-dom'
import { Trophy } from 'lucide-react'

const NAV_LINKS = [
  { to: '/teams', label: 'Команды' },
  { to: '/groups', label: 'Группы' },
  { to: '/bracket', label: 'Плей-офф' },
  { to: '/matches', label: 'Матчи' },
  { to: '/players', label: 'Бомбардиры' },
  { to: '/awards', label: 'Награды' },
]

export function Header() {
  return (
    <header className="site-header sticky top-0 z-30 border-b border-slate-700 bg-slate-950/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <Trophy className="h-6 w-6 text-court-400" />
          <span className="font-black uppercase text-lg text-white leading-tight tracking-tight">
            Кубок Авесто<span className="text-court-400">-2026</span>
          </span>
        </NavLink>

        <nav className="hidden xl:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative px-3 py-2 rounded-xl border border-transparent text-sm font-semibold uppercase tracking-wide whitespace-nowrap transition-all duration-200 ease-out hover:z-10 hover:scale-110 hover:border-white/20 hover:bg-white/10 hover:backdrop-blur-md hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] ${
                  isActive ? 'text-court-400' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

      </div>

      <nav className="xl:hidden grid grid-cols-3 gap-1 px-4 pb-2">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-2 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-center transition-colors ${
                isActive ? 'bg-court-400/15 text-court-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
