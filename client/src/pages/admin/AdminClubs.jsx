// client/src/pages/admin/AdminClubs.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { CrudModal } from './CrudModal.jsx'

const fields = [
  { name: 'name', label: 'Nombre del club', required: true },
  { name: 'city', label: 'Ciudad', required: true },
  { name: 'address', label: 'Dirección' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'owner_id', label: 'ID del propietario', type: 'number', hint: 'Deja vacío para asignarte como propietario' },
]

export default function AdminClubs() {
  const [clubs, setClubs] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  async function load() {
    setError(null)
    try { const { clubs } = await api.adminListClubs(); setClubs(clubs) }
    catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  async function save(data) {
    const body = { ...data }
    if (!body.owner_id) delete body.owner_id   // backend usa req.userId si no se manda
    if (editing && editing !== 'new') {
      await api.adminUpdateClub(editing.id, body)
    } else {
      await api.adminCreateClub(body)
    }
    await load()
  }

  async function remove(c) {
    if (!window.confirm(`¿Eliminar el club "${c.name}"? Las pistas asociadas también se borrarán.`)) return
    try { await api.adminDeleteClub(c.id); await load() }
    catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="accent" onClick={() => setEditing('new')}>+ Nuevo club</Button>
      </div>

      {error && <p className="text-rose-600 mb-3">{error}</p>}
      {!clubs && !error && <p className="text-slate-500">Cargando...</p>}
      {clubs && clubs.length === 0 && <Card className="text-center text-slate-500 py-8">No hay clubes</Card>}

      <div className="space-y-2">
        {clubs?.map(c => (
          <Card key={c.id} className="flex items-start gap-3">
            <div className="text-3xl">🏟️</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-slate-500">{c.address || '—'}</div>
              <div className="flex flex-wrap gap-1.5 mt-1 text-xs">
                <Badge>📍 {c.city}</Badge>
                <Badge variant="brand">{c.court_count} pistas</Badge>
                {c.phone && <Badge>📞 {c.phone}</Badge>}
                {c.owner_id && <Badge>owner #{c.owner_id}</Badge>}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-1">
              <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Editar</Button>
              <Button size="sm" variant="danger" onClick={() => remove(c)}>Borrar</Button>
            </div>
          </Card>
        ))}
      </div>

      <CrudModal
        open={!!editing}
        title={editing === 'new' ? 'Nuevo club' : `Editar ${editing?.name}`}
        fields={fields}
        initial={editing !== 'new' ? editing : null}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
    </div>
  )
}
