import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { LayoutDashboard, AlertCircle, Users, Menu, LogOut, ChevronDown, CreditCard } from 'lucide-react'

const navItems = [
  { to: '/', end: true, icon: LayoutDashboard, label: 'Inicio' },
  { to: '/incidencias', icon: AlertCircle, label: 'Incidencias' },
  { to: '/cobros', icon: CreditCard, label: 'Cobros x Día' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        style={{ width: collapsed ? 64 : 240, transition: 'width 0.2s ease' }}
        className="bg-slate-900 flex flex-col flex-shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/60">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-sm whitespace-nowrap">
              Auditoría Finanzas
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-700 text-xs font-bold">
                  {(user?.nombre || user?.usuario || 'U')[0].toUpperCase()}
                </span>
              </div>
              <span>{user?.nombre || user?.usuario}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
