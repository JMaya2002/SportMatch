import { useEffect, useState } from 'react'
import { api, API_MODE } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { SportIcon } from '../components/ui/SportIcon.jsx'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (API_MODE !== 'real' || !api.listMyBookings) {
      setLoading(false); return
    }
    api.listMyBookings()
      .then(({ bookings }) => setBookings(bookings))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Mis reservas</h1>
      {API_MODE !== 'real' && (
        <Card className="text-center text-slate-500">Conecta el backend para ver tus reservas reales.</Card>
      )}
      {loading && <p className="text-slate-500">Cargando...</p>}
      {!loading && bookings.length === 0 && API_MODE === 'real' && (
        <Card className="text-center text-slate-500 py-8">
          <div className="text-4xl mb-2">📅</div>
          Aún no tienes reservas.
        </Card>
      )}
      <div className="space-y-2">
        {bookings.map(b => (
          <Card key={b.id} className="flex items-center gap-3">
            <SportIcon sport={b.sport} className="text-3xl" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{b.club_name} · {b.court_name}</div>
              <div className="text-sm text-slate-500">
                {new Date(b.booking_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                {' · '}{String(b.start_hour).padStart(2,'0')}:00–{String(b.end_hour).padStart(2,'0')}:00
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{b.city}</div>
            </div>
            <div className="text-right">
              <div className="font-bold">{b.total_price}€</div>
              <Badge variant={b.status === 'paid' ? 'brand' : b.status === 'cancelled' ? 'accent' : undefined}>
                {b.status === 'paid' ? '✓ Pagado' : b.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
