// client/src/pages/Profile.jsx
import { useEffect, useState } from 'react'

const AVAILABILITY_OPTIONS = [
  { value: 'mananas_semana', label: 'Mañanas entre semana' },
  { value: 'tardes_semana',  label: 'Tardes entre semana' },
  { value: 'noches_semana',  label: 'Noches entre semana' },
  { value: 'mananas_finde',  label: 'Mañanas fin de semana' },
  { value: 'tardes_finde',   label: 'Tardes fin de semana' },
]

const OBJECTIVE_OPTIONS = [
  { value: 'competir',      label: '🏆 Competir' },
  { value: 'entrenar',      label: '💪 Entrenar' },
  { value: 'pasarlo_bien',  label: '😄 Pasarlo bien' },
  { value: 'buscar_equipo', label: '🔍 Buscar equipo' },
]
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SportIcon, sportLabel } from '../components/ui/SportIcon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Profile() {
  const { slug } = useParams()
  const username = slug?.startsWith('@') ? slug.slice(1) : slug
  const { user: me } = useAuth()

  const [user, setUser]         = useState(null)
  const [error, setError]       = useState(null)
  const [friendship, setFriendship] = useState(null)  // 'none' | 'sent' | 'received' | 'friends' | 'self'
  const [busy, setBusy]         = useState(false)
  const [userMeetups, setUserMeetups] = useState([])

  useEffect(() => {
    setError(null); setUser(null); setFriendship(null); setUserMeetups([])
    api.getUser(username)
      .then(({ user }) => {
        setUser(user)
        // Estado de amistad (funciona tanto en mock como en real)
        if (me && user && me.id !== user.id) {
          api.friendshipStatus(user.id).then(({ status }) => setFriendship(status)).catch(() => {})
        } else if (me && user && me.id === user.id) {
          setFriendship('self')
        }
        // Quedadas del usuario (se filtra por creator.username — funciona en ambos modos)
        api.listMeetups()
          .then(({ meetups }) =>
            setUserMeetups(meetups.filter(m => m.creator?.username === user.username))
          )
          .catch(() => {})
      })
      .catch(err => setError(err.message))
  }, [username, me])

  async function friendAction(action) {
    if (!user) return
    setBusy(true)
    try {
      if (action === 'send')   { await api.sendFriendRequest(user.id);  setFriendship('sent') }
      if (action === 'accept') { await api.acceptFriend(user.id);       setFriendship('friends') }
      if (action === 'remove') { await api.removeFriend(user.id);       setFriendship('none') }
    } catch (e) { alert(e.message) }
    finally { setBusy(false) }
  }

  if (error) return <p className="p-4 text-rose-600">{error}</p>
  if (!user) return <p className="p-4 text-slate-500">Cargando perfil...</p>

  const isMe = me?.username === user.username

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <Card className="overflow-hidden p-0">
        <div className="h-28 bg-gradient-to-br from-brand to-emerald-700" />
        <div className="p-4 -mt-12">
          <Avatar src={user.avatar_url} name={user.name} size="xl" />
          <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-slate-500">@{user.username}</p>
            </div>
            {isMe ? (
              <Link to="/me"><Button variant="outline" size="sm">Editar perfil</Button></Link>
            ) : !me ? (
              <Link to="/login"><Button variant="primary" size="sm">Inicia sesión</Button></Link>
            ) : friendship === 'friends' ? (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => { if (window.confirm('¿Eliminar amistad?')) friendAction('remove') }}>
                ✓ Amigos
              </Button>
            ) : friendship === 'sent' ? (
              <Button variant="outline" size="sm" disabled={busy} onClick={() => friendAction('remove')}>Solicitud enviada · Cancelar</Button>
            ) : friendship === 'received' ? (
              <Button variant="primary" size="sm" disabled={busy} onClick={() => friendAction('accept')}>Aceptar solicitud</Button>
            ) : friendship === 'none' ? (
              <Button variant="primary" size="sm" disabled={busy} onClick={() => friendAction('send')}>+ Añadir amigo</Button>
            ) : null}
          </div>
          {user.bio && <p className="text-slate-700 mt-3">{user.bio}</p>}

          {(user.position || user.availability?.length > 0 || user.objectives?.length > 0) && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Sobre mí</h2>
              <div className="flex flex-wrap gap-2">
                {user.position && (
                  <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-700">
                    📍 {user.position}
                  </span>
                )}
                {user.availability?.map(v => {
                  const opt = AVAILABILITY_OPTIONS.find(o => o.value === v)
                  return opt ? (
                    <span key={v} className="px-2 py-1 bg-blue-50 rounded text-sm text-blue-700">
                      🕐 {opt.label}
                    </span>
                  ) : null
                })}
                {user.objectives?.map(v => {
                  const opt = OBJECTIVE_OPTIONS.find(o => o.value === v)
                  return opt ? (
                    <span key={v} className="px-2 py-1 bg-emerald-50 rounded text-sm text-emerald-700">
                      {opt.label}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Info label="Edad"    value={`${user.age} años`} />
            <Info label="Ciudad"  value={user.city} />
            <Info label="Deporte" value={<><SportIcon sport={user.main_sport} /> {sportLabel(user.main_sport)}</>} />
            <Info label="Nivel"   value={<Badge level={user.level}>{user.level}</Badge>} />
          </div>
        </div>
      </Card>

      {userMeetups.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-6 mb-3">Quedadas creadas</h2>
          <div className="space-y-2">
            {userMeetups.map(m => (
              <Link key={m.id} to={`/meetups/${m.id}`}>
                <Card className="hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{m.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(m.meetup_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{m.city}
                      </div>
                    </div>
                    <Badge level={m.level}>{m.level}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  )
}
