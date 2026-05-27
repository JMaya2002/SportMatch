// client/src/pages/Clubs.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { FilterBar } from '../components/forms/FilterBar.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'

export default function Clubs() {
  const [filters, setFilters] = useState({ city: '', province: '' })
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.listClubs(filters)
      .then(({ clubs }) => setClubs(clubs))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clubs deportivos</h1>
        <p className="text-slate-500">Reserva pistas en clubs cerca de ti</p>
      </div>
      <FilterBar filters={filters} onChange={setFilters} showSport={false} showLevel={false} />

      {loading ? (
        <p className="text-slate-500">Cargando clubs...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map(c => (
            <Link key={c.id} to={`/clubs/${c.id}`}>
              <Card className="p-0 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                <div
                  className="h-40 bg-cover bg-center bg-slate-200"
                  style={{ backgroundImage: c.photos[0] ? `url(${c.photos[0]})` : 'none' }}
                />
                <div className="p-4">
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <p className="text-sm text-slate-500">{c.address}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                    <Badge>📍 {c.city}</Badge>
                    <Badge variant="brand">{c.courts.length} {c.courts.length === 1 ? 'pista' : 'pistas'}</Badge>
                    <Badge variant="accent">desde {Math.min(...c.courts.map(p => p.price_per_hour))}€/h</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
