// client/src/pages/Meetups.jsx
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { FilterBar } from '../components/forms/FilterBar.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SportIcon, sportLabel } from '../components/ui/SportIcon.jsx'

export default function Meetups() {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    sport: searchParams.get('sport') || '',
    level: searchParams.get('level') || '',
    city: searchParams.get('city') || '',
    province: searchParams.get('province') || '',
  })
  const [meetups, setMeetups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.listMeetups(filters)
      .then(({ meetups }) => setMeetups(meetups))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quedadas</h1>
          <p className="text-slate-500">Apúntate o crea la tuya</p>
        </div>
        <Link to="/meetups/new"><Button variant="accent">+ Crear quedada</Button></Link>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <p className="text-slate-500">Cargando quedadas...</p>
      ) : meetups.length === 0 ? (
        <Card className="text-center text-slate-500 py-12">
          <div className="text-4xl mb-2">🗓️</div>
          No hay quedadas con esos filtros. Sé el primero — crea una.
        </Card>
      ) : (
        <div className="space-y-3">
          {meetups.map(m => <MeetupCard key={m.id} m={m} />)}
        </div>
      )}
    </div>
  )
}

function MeetupCard({ m }) {
  const date = new Date(m.meetup_date)
  const dateLabel = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeLabel = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const isFull = m.current_players >= m.max_players

  return (
    <Link to={`/meetups/${m.id}`}>
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="text-3xl">
            <SportIcon sport={m.sport} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg">{m.title}</h3>
              {isFull && <Badge variant="accent">Completa</Badge>}
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 mt-1">{m.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              <Badge variant="brand">{sportLabel(m.sport)}</Badge>
              <Badge level={m.level}>{m.level}</Badge>
              <Badge>📍 {m.city}</Badge>
              <Badge>📅 {dateLabel} · {timeLabel}</Badge>
              <Badge>👥 {m.current_players}/{m.max_players}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <Avatar src={m.creator.avatar_url} name={m.creator.name} size="sm" />
              <span className="text-xs text-slate-500">Organiza <strong className="text-slate-700">{m.creator.name}</strong></span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
