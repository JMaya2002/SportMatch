// client/src/pages/admin/AdminHome.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { Card } from '../../components/ui/Card.jsx'

function StatCard({ label, value, icon, to, color = 'brand' }) {
  const body = (
    <Card className={`hover:shadow-md transition`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
          <div className={`text-3xl font-bold mt-1 text-${color}-dark`}>{value ?? '—'}</div>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export default function AdminHome() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.adminStats?.().then(({ stats }) => setStats(stats)).catch(e => setError(e.message))
  }, [])

  if (error) return <p className="text-rose-600">{error}</p>
  if (!stats) return <p className="text-slate-500">Cargando estadísticas...</p>

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Deportistas" value={stats.users} icon="👥" to="/admin/deportistas" />
        <StatCard label="Admins"      value={stats.admins} icon="🛡️" />
        <StatCard label="Clubes"      value={stats.clubs} icon="🏟️" to="/admin/clubes" />
        <StatCard label="Pistas"      value={stats.courts} icon="🎾" />
        <StatCard label="Eventos"     value={stats.meetups} icon="🤝" to="/admin/eventos" />
        <StatCard label="Reservas pagadas" value={stats.paid_bookings} icon="💳" />
        <StatCard label="Comisión total" value={`${stats.total_fees.toFixed(2)}€`} icon="💰" />
      </div>
      <Card>
        <h2 className="font-semibold mb-2">Atajos</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/admin/deportistas" className="px-3 py-1.5 rounded bg-brand-light text-brand-dark hover:bg-emerald-200">Gestionar deportistas</Link>
          <Link to="/admin/clubes"      className="px-3 py-1.5 rounded bg-orange-100 text-orange-800 hover:bg-orange-200">Gestionar clubes</Link>
          <Link to="/admin/eventos"     className="px-3 py-1.5 rounded bg-sky-100 text-sky-800 hover:bg-sky-200">Gestionar eventos</Link>
        </div>
      </Card>
    </div>
  )
}
