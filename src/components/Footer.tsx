import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Главная' },
  { to: '/groups', label: 'Группы' },
  { to: '/bracket', label: 'Плей-офф' },
  { to: '/matches', label: 'Матчи' },
]

const INFO_LINKS = [
  { to: '/players', label: 'Бомбардиры' },
  { to: '/awards', label: 'Награды' },
  { to: '/admin', label: 'Админ-панель' },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-slate-950 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-3">
            <Trophy className="h-6 w-6 text-court-400" />
            <span className="font-black uppercase text-white leading-tight">
              Кубок Авесто<span className="text-court-400">-2026</span>
            </span>
          </Link>
          <p className="text-slate-500 text-sm leading-relaxed">
            Корпоративный баскетбольный турнир среди команд ООО «Авесто Групп».
          </p>
        </div>

        <div>
          <h3 className="text-white font-bold uppercase text-sm tracking-wide mb-3">Навигация</h3>
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-slate-400 text-sm hover:text-court-400 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold uppercase text-sm tracking-wide mb-3">Информация</h3>
          <ul className="flex flex-col gap-2">
            {INFO_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-slate-400 text-sm hover:text-court-400 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold uppercase text-sm tracking-wide mb-3">Организатор</h3>
          <p className="text-slate-400 text-sm leading-relaxed">ООО «Авесто Групп»</p>
          <p className="text-slate-400 text-sm leading-relaxed mt-1">Душанбе, Таджикистан</p>
          <h3 className="text-white font-bold uppercase text-sm tracking-wide mb-3 mt-6">Место проведения</h3>
          <a
            href="https://yandex.tj/maps/org/spetsializirovannaya_detsko_yunosheskaya_shkola_olimpiyskogo_rezerva_5/214464609459/?ll=68.744996%2C38.554058&z=16"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 text-sm leading-relaxed hover:text-court-400 transition-colors"
          >
            ул. Дж. Расулова 41, г. Душанбе
          </a>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-slate-600 text-xs">
          © 2026 Кубок Авесто. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
