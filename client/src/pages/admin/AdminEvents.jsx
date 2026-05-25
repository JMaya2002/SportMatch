// client/src/pages/admin/AdminEvents.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { CrudModal } from './CrudModal.jsx'
import { SPORTS, LEVELS } from '../../components/forms/FilterBar.jsx'

const sportOpts = SPORTS.filter(s => s.value)
const levelOpts = LEVELS.filter(s => s.value)
const statusOpts = [
  { value: 'open',      label: 'Abierta' },
  { value: 'full',      label: 'Completa' },
  { value: 'cancelled', label: 'Cancelada' },
]

const fields = [
  { name: 'title',       label: 'Título', required: true },
  { name: 'creator_id',  label: 'ID del creador', type: 'number', required: true, hint: 'Usuario que figura como organizador' },
  { name: 'sport',       label: 'Deporte', type: 'select', options: sportOpts, default: 'padel' },
  { name: 'level',       label: 'Nivel',   type: 'select', options: levelOpts, default: 'intermedio' },
  { name: 'city',        label: 'Ciudad', required: true },
  { name: 'location',    label: 'Lugar' },
  { name: 'meetup_date', label: 'Fecha y hora', type: 'datetime-local', required: true },
  { name: 'max_players', label: 'Plazas máx.', type: 'number', default: 4 },
  { name: 'status',      label: 'Estado', type: 'select', options: statusOpts, default: 'open' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
]

export default function AdminEvents() {
  const [meetups, setMeetups] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  async function load() {
    setError(null)
    try { const { meetups } = await api.adminListMeetups(); setMeetups(meetups) }
    catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  async function save(data) {
    if (editing && editing !== 'new') {
      await api.adminUpdateMeetup(editing.id, data)
    } else {
      await api.adminCreateMeetup(data)
    }
    await load()
  }

  async function remove(m) {
    if (!window.confirm(`¿Eliminar el evento "${m.title}"?`)) return
    try { await api.adminDeleteMeetup(m.id); await load() }
    catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="accent" onClick={() => setEditing('new')}>+ Nuevo evento</Button>
      </div>

      {error && <p className="text-rose-600 mb-3">{error}</p>}
      {!meetups && !error && <p className="text-slate-500">Cargando...</p>}
      {meetups && meetups.length === 0 && <Card className="text-center text-slate-500 py-8">No hay eventos</Card>}

      <div className="space-y-2">
        {meetups?.map(m => (
          <Card key={m.id} className="flex items-start gap-3">
            <div className="text-3xl">🤝</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{m.title}</div>
              <div className="text-sm text-slate-500">
                {new Date(m.meetup_date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                {m.creator_username && <> · por @{m.creator_username}</>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1 text-xs">
                <Badge variant="brand">{m.sport}</Badge>
                <Badge level={m.level}>{m.level}</Badge>
                <Badge>📍 {m.city}</Badge>
                <Badge>👥 {m.participants_count}/{m.max_players}</Badge>
                <Badge variant={m.status === 'cancelled' ? 'accent' : undefined}>{m.status}</Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-1">
              <Button size="sm" variant="outline" onClick={() => setEditing(m)}>Editar</Button>
              <Button size="sm" variant="danger" onClick={() => remove(m)}>Borrar</Button>
            </div>
          </Card>
        ))}
      </div>

      <CrudModal
        open={!!editing}
        title={editing === 'new' ? 'Nuevo evento' : `Editar evento`}
        fields={fields}
        initial={editing !== 'new' ? {
          ...editing,
          // datetime-local necesita formato YYYY-MM-DDTHH:mm
          meetup_date: editing?.meetup_date ? new Date(editing.meetup_date).toISOString().slice(0,16) : '',
        } : null}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
    </div>
  )
}
