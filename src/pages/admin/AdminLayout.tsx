import { Link, NavLink, Outlet } from 'react-router-dom'
import { ExternalLink, LogOut } from 'lucide-react'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { ToastProvider } from '../../hooks/useToast'
import { ConfirmProvider } from '../../hooks/useConfirm'
import { AdminLoginPage } from './AdminLoginPage'

const ADMIN_LINKS = [
  { to: '/admin/teams', label: 'Команды' },
  { to: '/admin/matches', label: 'Матчи' },
  { to: '/admin/awards', label: 'Награды' },
  { to: '/admin/settings', label: 'Настройки' },
]

// Дублирует X-Robots-Tag с сервера — для краулеров, которые исполняют JS.
// React 19 сам поднимает <meta> в <head>, отдельная библиотека не нужна
function NoIndex() {
  return <meta name="robots" content="noindex, nofollow" />
}

export function AdminLayout() {
  const { isAuthed, login, logout } = useAdminAuth()

  // До проверки isAuthed — чтобы тег стоял и на странице логина
  if (!isAuthed)
    return (
      <>
        <NoIndex />
        <AdminLoginPage login={login} />
      </>
    )

  return (
    <ToastProvider>
    <ConfirmProvider>
      <NoIndex />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <nav className="flex items-center gap-1">
            {ADMIN_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-court-500/15 text-court-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> На сайт
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" /> Выйти
            </button>
          </div>
        </div>
        <Outlet />
      </div>
    </ConfirmProvider>
    </ToastProvider>
  )
}
