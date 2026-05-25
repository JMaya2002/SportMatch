// client/src/pages/MeetupDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SportIcon, sportLabel } from '../components/ui/SportIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function MeetupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [meetup, setMeetup] = useState(null)
  const [joined, setJoined] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    api.getMeetup(id).then(({ meetup }) => setMeetup(meetup))
  }, [id])

  async function join() {
    setJoining(true)
    await api.joinMeetup(id)
    setJoined(true)
    setMeetup(m => ({ ...m, current_players: m.current_players + 1 }))
    setJoining(false)
  }

  if (!meetup) return <p className="p-4 text-slate-500">Cargando...</p>

  const date = new Date(meetup.meetup_date)
  const fullDate = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const isFull = meetup.current_players >= meetup.max_players

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <Link to="/meetups" className="text-sm text-slate-500 hover:text-brand">← Volver a quedadas</Link>
      <Card className="mt-3">
        <div className="flex items-start gap-3">
          <div className="text-4xl">
            <SportIcon sport={meetup.sport} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{meetup.title}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              <Badge variant="brand">{sportLabel(meetup.sport)}</Badge>
              <Badge level={meetup.level}>{meetup.level}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="📅 Cuándo"  value={`${fullDate} a las ${time}`} />
          <Info label="📍 Dónde"   value={meetup.location} />
          <Info label="🏙️ Ciudad"  value={meetup.city} />
          <Info label="👥 Plazas"  value={`${meetup.current_players} de ${meetup.max_players}`} />
        </div>

        <p className="text-slate-700 mt-4">{meetup.description}</p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
          <Avatar src={meetup.creator.avatar_url} name={meetup.creator.name} size="md" />
          <div className="flex-1">
            <div className="text-xs text-slate-500">Organiza</div>
            <Link to={`/@${meetup.creator.username}`} className="font-semibold hover:text-brand">{meetup.creator.name}</Link>
          </div>
        </div>

        <div className="mt-4">
          {!user ? (
            <Link to="/login"><Button variant="primary" className="w-full">Inicia sesión para unirte</Button></Link>
          ) : joined ? (
            <Button variant="outline" className="w-full" disabled>✓ Te has unido a la quedada</Button>
          ) : isFull ? (
            <Button variant="outline" className="w-full" disabled>Quedada completa</Button>
          ) : (
            <Button variant="primary" className="w-full" onClick={join} disabled={joining}>
              {joining ? 'Uniéndote...' : 'Unirme a la quedada'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  )
}
