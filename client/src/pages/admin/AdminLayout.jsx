// client/src/pages/admin/AdminLayout.jsx
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Card } from '../../components/ui/Card.jsx'

const tabs = [
  { to: '/admin',             label: 'Resumen',     icon: '📊', end: true },
  { to: '/admin/deportistas', label: 'Deportistas', icon: '👥' },
  { to: '/admin/clubes',      label: 'Clubes',      icon: '🏟️' },
  { to: '/admin/eventos',     label: 'Eventos',     icon: '🤝' },
]

export default function AdminLayout() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-4">Cargando...</p>
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) {
    return (
      <div className="max-w-md mx-auto p-4 mt-10">
        <Card className="text-center">
          <div className="text-5xl mb-3">🚫</div>
          <h1 className="text-2xl font-bold">Acceso denegado</h1>
          <p className="text-slate-500 mt-2">Solo los administradores pueden acceder al panel.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-24">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Panel de administración</h1>
          <p className="text-sm text-slate-500">Conectado como <strong>@{user.username}</strong></p>
        </div>
      </div>

      {/* Tabs (sticky en móvil) */}
      <nav className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-slate-200 sticky top-14 bg-slate-50/95 backdrop-blur z-[5]">
        {tabs.map(t => (
          <NavLink
            key={t.to} to={t.to} end={t.end}
            className={({ isActive }) =>
              `px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 ${
                isActive ? 'text-brand-dark border-brand' : 'text-slate-600 border-transparent hover:text-slate-900'
              }`
            }
          >
            <span className="mr-1">{t.icon}</span>{t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
