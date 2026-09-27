import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, LayoutDashboard, Leaf, LogOut, Menu, PlusCircle, Users, X } from 'lucide-react'
import { useAuth } from '../auth/context'
import { Avatar } from './Avatar'
import { cx } from './styles'

const NAV = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, match: (p: string) => p === '/' },
  {
    to: '/patients',
    label: 'Pacientes',
    icon: Users,
    match: (p: string) => p === '/patients' || /^\/patients\/\d+/.test(p) || /^\/patients\/\d+\/edit$/.test(p),
  },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, match: (p: string) => p === '/agenda' },
  { to: '/patients/new', label: 'Nuevo', icon: PlusCircle, match: (p: string) => p === '/patients/new' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function navLink({ to, label, icon: Icon, match }: (typeof NAV)[number]) {
    const isActive = match(location.pathname)
    return (
      <Link
        key={to}
        to={to}
        onClick={() => setOpen(false)}
        className={cx(
          'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all',
          isActive
            ? 'border-primary bg-primary text-white shadow-md'
            : 'border-line bg-white text-muted hover:border-gray-300 hover:bg-paper hover:text-ink',
        )}
      >
        <Icon className={cx('h-5 w-5', isActive ? 'text-white' : 'text-muted')} />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <nav className="sticky top-0 z-50 border-b border-line bg-white shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white">
                <Leaf className="h-6 w-6" />
              </span>
              <span className="text-xl font-bold tracking-tight">NutriLog</span>
            </Link>
            <span className="hidden items-center gap-2 md:flex">
              <Avatar seed={user?.username ?? 'A'} className="h-8 w-8" />
              <span className="text-xs text-faint">Hola, {user?.username}</span>
            </span>
          </div>

          <div className="hidden items-center gap-2 lg:flex lg:gap-3">
            {NAV.map(navLink)}
            <div className="mx-1 hidden h-8 w-px bg-line lg:block" />
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            className="text-muted hover:text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 lg:hidden">
            {NAV.map((item) => {
              const isActive = item.match(location.pathname)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cx(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold',
                    isActive ? 'border-primary bg-primary text-white' : 'border-line bg-white text-muted',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600"
            >
              <LogOut className="h-5 w-5" />
              Salir
            </button>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div key={location.pathname} className="animate-page">
          {children}
        </div>
      </main>
    </div>
  )
}
