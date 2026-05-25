// client/src/pages/MyFriends.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'

const tabs = [
  { key: 'friends',  label: 'Amigos',     icon: '🤝' },
  { key: 'received', label: 'Solicitudes', icon: '📥' },
  { key: 'sent',     label: 'Enviadas',   icon: '📤' },
]

function UserCard({ u, actions }) {
  return (
    <Card className="flex items-center gap-3">
      <Link to={`/@${u.username}`}><Avatar src={u.avatar_url} name={u.name} size="md" /></Link>
      <div className="flex-1 min-w-0">
        <Link to={`/@${u.username}`} className="font-semibold hover:text-brand">{u.name}</Link>
        <div className="text-sm text-slate-500 truncate">@{u.username}{u.city && ` · ${u.city}`}</div>
        {u.main_sport && (
          <div className="flex gap-1.5 mt-1 text-xs">
            <Badge variant="brand">{u.main_sport}</Badge>
            {u.level && <Badge level={u.level}>{u.level}</Badge>}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">{actions}</div>
    </Card>
  )
}

export default function MyFriends() {
  const [tab, setTab] = useState('friends')
  const [data, setData] = useState({ friends: [], received: [], sent: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true); setError(null)
    try { setData(await api.myFriends()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function accept(id) { try { await api.acceptFriend(id); await load() } catch (e) { alert(e.message) } }
  async function reject(id) {
    if (!window.confirm('¿Rechazar solicitud?')) return
    try { await api.removeFriend(id); await load() } catch (e) { alert(e.message) }
  }
  async function cancel(id) {
    if (!window.confirm('¿Cancelar solicitud enviada?')) return
    try { await api.removeFriend(id); await load() } catch (e) { alert(e.message) }
  }
  async function unfriend(id) {
    if (!window.confirm('¿Eliminar amistad?')) return
    try { await api.removeFriend(id); await load() } catch (e) { alert(e.message) }
  }

  const list = data[tab] || []

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-4">Amigos</h1>
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.key ? 'text-brand-dark border-brand' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            {t.icon} {t.label}
            {data[t.key]?.length > 0 && <span className="ml-1 text-xs text-slate-400">({data[t.key].length})</span>}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-rose-600">{error}</p>}
      {!loading && list.length === 0 && (
        <Card className="text-center text-slate-500 py-8">
          {tab === 'friends'  && 'Aún no tienes amigos. Explora deportistas y envía solicitudes.'}
          {tab === 'received' && 'No tienes solicitudes pendientes.'}
          {tab === 'sent'     && 'No has enviado ninguna solicitud.'}
        </Card>
      )}

      <div className="space-y-2">
        {tab === 'friends' && list.map(u => (
          <UserCard key={u.id} u={u} actions={
            <Button size="sm" variant="outline" onClick={() => unfriend(u.id)}>Eliminar</Button>
          } />
        ))}
        {tab === 'received' && list.map(u => (
          <UserCard key={u.id} u={u} actions={<>
            <Button size="sm" variant="primary" onClick={() => accept(u.id)}>Aceptar</Button>
            <Button size="sm" variant="outline" onClick={() => reject(u.id)}>Rechazar</Button>
          </>} />
        ))}
        {tab === 'sent' && list.map(u => (
          <UserCard key={u.id} u={u} actions={
            <Button size="sm" variant="outline" onClick={() => cancel(u.id)}>Cancelar</Button>
          } />
        ))}
      </div>
    </div>
  )
}
