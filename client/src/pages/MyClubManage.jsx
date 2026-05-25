// client/src/pages/MyClubManage.jsx
// Vista del owner para gestionar un club: perfil, recintos+pistas, seguidores, reservas.
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { SportIcon } from '../components/ui/SportIcon.jsx'
import { SPORTS } from '../components/forms/FilterBar.jsx'

const sportOpts = SPORTS.filter(s => s.value)

export default function MyClubManage() {
  const { id } = useParams()
  const [tab, setTab] = useState('info')
  const [club, setClub] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    setError(null)
    try { const { club } = await api.getClub(id); setClub(club) }
    catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [id])

  if (error) return <p className="p-4 text-rose-600">{error}</p>
  if (!club) return <p className="p-4 text-slate-500">Cargando...</p>
  if (!club.is_owner) {
    return (
      <div className="max-w-md mx-auto p-4 mt-10">
        <Card className="text-center">
          <div className="text-5xl mb-3">🚫</div>
          <p>No eres el propietario de este club.</p>
          <Link to="/me/clubs" className="text-brand mt-3 inline-block">← Volver</Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Link to="/me/clubs" className="text-sm text-slate-500 hover:text-brand">← Mis clubes</Link>
      <h1 className="text-2xl font-bold mt-1">{club.name}</h1>
      <p className="text-sm text-slate-500">{club.city} · {club.followers_count} seguidores</p>

      <nav className="flex gap-1 overflow-x-auto pb-2 mt-4 mb-4 border-b border-slate-200">
        {[
          { k: 'info',      l: 'Información' },
          { k: 'venues',    l: 'Recintos y pistas' },
          { k: 'followers', l: 'Seguidores' },
          { k: 'bookings',  l: 'Reservas' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              tab === t.k ? 'text-brand-dark border-brand' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}>{t.l}</button>
        ))}
      </nav>

      {tab === 'info'      && <InfoTab club={club} onChange={load} />}
      {tab === 'venues'    && <VenuesTab club={club} onChange={load} />}
      {tab === 'followers' && <FollowersTab clubId={club.id} />}
      {tab === 'bookings'  && <BookingsTab clubId={club.id} />}
    </div>
  )
}

// ── INFO ──────────────────────────────────────────────────
function InfoTab({ club, onChange }) {
  const [form, setForm] = useState({
    name: club.name, city: club.city, address: club.address || '',
    description: club.description || '', phone: club.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  async function save(e) {
    e.preventDefault(); setSaving(true); setMsg(null)
    try { await api.updateOwnClub(club.id, form); setMsg('Guardado ✓'); await onChange(); setTimeout(() => setMsg(null), 2000) }
    catch (e) { setMsg(e.message) }
    finally { setSaving(false) }
  }
  function up(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Card>
      <form onSubmit={save} className="space-y-3">
        <Input label="Nombre" value={form.name} onChange={e => up('name', e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ciudad" value={form.city} onChange={e => up('city', e.target.value)} required />
          <Input label="Teléfono" value={form.phone} onChange={e => up('phone', e.target.value)} />
        </div>
        <Input label="Dirección" value={form.address} onChange={e => up('address', e.target.value)} />
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">Descripción</span>
          <textarea rows={3} value={form.description} onChange={e => up('description', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
      </form>
    </Card>
  )
}

// ── VENUES + COURTS ──────────────────────────────────────
function VenuesTab({ club, onChange }) {
  const [newVenue, setNewVenue] = useState(false)
  const [vForm, setVForm] = useState({ name: '', city: club.city, address: '', description: '', phone: '' })
  const [editing, setEditing] = useState({})   // venueId → court draft
  const [error, setError] = useState(null)

  async function createVenue(e) {
    e.preventDefault(); setError(null)
    try { await api.createVenue(club.id, vForm); setNewVenue(false); setVForm({ name: '', city: club.city, address: '', description: '', phone: '' }); await onChange() }
    catch (e) { setError(e.message) }
  }
  async function delVenue(id) {
    if (!window.confirm('¿Eliminar este recinto y sus pistas?')) return
    try { await api.deleteVenue(id); await onChange() } catch (e) { alert(e.message) }
  }
  async function delCourt(id) {
    if (!window.confirm('¿Eliminar pista?')) return
    try { await api.deleteCourt(id); await onChange() } catch (e) { alert(e.message) }
  }
  async function createCourt(venueId, draft) {
    try {
      await api.createCourt(venueId, {
        name: draft.name, sport: draft.sport,
        price_per_hour: Number(draft.price_per_hour),
        opening_hour: Number(draft.opening_hour) || 8,
        closing_hour: Number(draft.closing_hour) || 22,
      })
      setEditing(e => ({ ...e, [venueId]: null }))
      await onChange()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-rose-600">{error}</p>}

      {club.venues.map(v => (
        <Card key={v.id}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold">{v.name}</div>
              <div className="text-xs text-slate-500">{v.address || v.city}</div>
            </div>
            <Button size="sm" variant="danger" onClick={() => delVenue(v.id)}>Borrar recinto</Button>
          </div>

          <div className="mt-3 space-y-2">
            {v.courts.length === 0 && <p className="text-xs text-slate-500">Sin pistas aún.</p>}
            {v.courts.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded bg-slate-50">
                <SportIcon sport={c.sport} className="text-2xl" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.sport} · {c.price_per_hour}€/h · {c.opening_hour}-{c.closing_hour}h</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => delCourt(c.id)}>Borrar</Button>
              </div>
            ))}

            {editing[v.id] ? (
              <CourtForm
                draft={editing[v.id]}
                onChange={d => setEditing(e => ({ ...e, [v.id]: d }))}
                onSubmit={() => createCourt(v.id, editing[v.id])}
                onCancel={() => setEditing(e => ({ ...e, [v.id]: null }))}
              />
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(e => ({ ...e, [v.id]: { name: '', sport: 'padel', price_per_hour: '', opening_hour: 8, closing_hour: 22 } }))}>
                + Añadir pista
              </Button>
            )}
          </div>
        </Card>
      ))}

      {newVenue ? (
        <Card>
          <form onSubmit={createVenue} className="space-y-2">
            <h3 className="font-semibold">Nuevo recinto</h3>
            <Input label="Nombre" required value={vForm.name} onChange={e => setVForm({ ...vForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Ciudad" required value={vForm.city} onChange={e => setVForm({ ...vForm, city: e.target.value })} />
              <Input label="Teléfono" value={vForm.phone} onChange={e => setVForm({ ...vForm, phone: e.target.value })} />
            </div>
            <Input label="Dirección" value={vForm.address} onChange={e => setVForm({ ...vForm, address: e.target.value })} />
            <div className="flex gap-2">
              <Button type="submit">Crear recinto</Button>
              <Button type="button" variant="outline" onClick={() => setNewVenue(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="accent" onClick={() => setNewVenue(true)}>+ Nuevo recinto</Button>
      )}
    </div>
  )
}

function CourtForm({ draft, onChange, onSubmit, onCancel }) {
  function up(k, v) { onChange({ ...draft, [k]: v }) }
  return (
    <div className="p-2 border border-dashed border-slate-300 rounded space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input label="Nombre" value={draft.name} onChange={e => up('name', e.target.value)} required />
        <Select label="Deporte" options={sportOpts} value={draft.sport} onChange={e => up('sport', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input label="€/hora" type="number" min={0} value={draft.price_per_hour} onChange={e => up('price_per_hour', e.target.value)} required />
        <Input label="Abre"  type="number" min={0} max={23} value={draft.opening_hour} onChange={e => up('opening_hour', e.target.value)} />
        <Input label="Cierra" type="number" min={1} max={24} value={draft.closing_hour} onChange={e => up('closing_hour', e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit}>Crear pista</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}

// ── FOLLOWERS ────────────────────────────────────────────
function FollowersTab({ clubId }) {
  const [users, setUsers] = useState(null)
  useEffect(() => { api.clubFollowers(clubId).then(({ followers }) => setUsers(followers)).catch(() => setUsers([])) }, [clubId])
  if (!users) return <p className="text-slate-500">Cargando...</p>
  if (users.length === 0) return <Card className="text-center text-slate-500 py-8">Aún no tienes seguidores.</Card>
  return (
    <div className="space-y-2">
      {users.map(u => (
        <Card key={u.id} className="flex items-center gap-3">
          <Avatar src={u.avatar_url} name={u.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{u.name}</div>
            <div className="text-xs text-slate-500">@{u.username} · {u.city}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── BOOKINGS ─────────────────────────────────────────────
function BookingsTab({ clubId }) {
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    api.clubBookings(clubId).then(({ bookings }) => setBookings(bookings)).catch(e => setError(e.message))
  }, [clubId])
  if (error) return <p className="text-rose-600">{error}</p>
  if (!bookings) return <p className="text-slate-500">Cargando...</p>
  if (bookings.length === 0) return <Card className="text-center text-slate-500 py-8">Sin reservas todavía.</Card>
  return (
    <div className="space-y-2">
      {bookings.map(b => (
        <Card key={b.id} className="flex items-center gap-3">
          <SportIcon sport={b.sport} className="text-3xl" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold">{b.court_name}</div>
            <div className="text-sm text-slate-500">
              {new Date(b.booking_date).toLocaleDateString('es-ES', { day:'numeric', month:'short' })} · {b.start_hour}:00–{b.end_hour}:00
            </div>
            <div className="text-xs text-slate-400">@{b.username || '?'}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">{b.total_price}€</div>
            <Badge variant={b.status === 'paid' ? 'brand' : 'accent'}>{b.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}
