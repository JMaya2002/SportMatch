// client/src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from 'react'
import { api } from '../../api/client.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Avatar } from '../../components/ui/Avatar.jsx'
import { CrudModal } from './CrudModal.jsx'
import { SPORTS, LEVELS } from '../../components/forms/FilterBar.jsx'

const sportOpts = SPORTS.filter(s => s.value)
const levelOpts = LEVELS.filter(s => s.value)

function fields(editing) {
  return [
    { name: 'username', label: 'Username', required: !editing, hint: 'Solo letras, números y _' },
    { name: 'name',     label: 'Nombre completo', required: true },
    { name: 'email',    label: 'Email', type: 'email', required: !editing },
    { name: 'password', label: editing ? 'Nueva contraseña (opcional)' : 'Contraseña', type: 'password' },
    { name: 'age',      label: 'Edad', type: 'number' },
    { name: 'city',     label: 'Ciudad' },
    { name: 'mainSport', label: 'Deporte', type: 'select', options: sportOpts, default: 'padel' },
    { name: 'level',     label: 'Nivel',   type: 'select', options: levelOpts, default: 'intermedio' },
    { name: 'is_admin',  label: '¿Administrador?', type: 'checkbox' },
  ]
}

export default function AdminUsers() {
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)   // null | 'new' | userObj
  const [filter, setFilter] = useState('')

  async function load() {
    setError(null)
    try { const { users } = await api.adminListUsers(); setUsers(users) }
    catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  async function save(data) {
    // Adaptar: el backend espera mainSport (camelCase) — ya viene así del form
    if (editing && editing !== 'new') {
      const body = { ...data }
      if (!body.password) delete body.password   // no machacar contraseña si está vacío
      await api.adminUpdateUser(editing.id, body)
    } else {
      await api.adminCreateUser(data)
    }
    await load()
  }

  async function remove(u) {
    if (!window.confirm(`¿Eliminar a @${u.username}? Esta acción no se puede deshacer.`)) return
    try { await api.adminDeleteUser(u.id); await load() }
    catch (e) { alert(e.message) }
  }

  const filtered = (users || []).filter(u =>
    !filter || u.username.includes(filter.toLowerCase()) || u.email?.includes(filter.toLowerCase()) || u.name?.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          placeholder="Buscar por nombre, username o email..."
          value={filter} onChange={e => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <Button variant="accent" onClick={() => setEditing('new')}>+ Nuevo deportista</Button>
      </div>

      {error && <p className="text-rose-600 mb-3">{error}</p>}
      {!users && !error && <p className="text-slate-500">Cargando...</p>}
      {users && filtered.length === 0 && <Card className="text-center text-slate-500 py-8">Sin resultados</Card>}

      <div className="space-y-2">
        {filtered.map(u => (
          <Card key={u.id} className="flex items-center gap-3">
            <Avatar src={u.avatar_url} name={u.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{u.name}</span>
                {u.is_admin && <Badge variant="brand">admin</Badge>}
              </div>
              <div className="text-sm text-slate-500 truncate">@{u.username} · {u.email}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {u.city} · {u.main_sport} · <span className="capitalize">{u.level}</span> · {u.age} años
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-1">
              <Button size="sm" variant="outline" onClick={() => setEditing(u)}>Editar</Button>
              <Button size="sm" variant="danger" onClick={() => remove(u)}>Borrar</Button>
            </div>
          </Card>
        ))}
      </div>

      <CrudModal
        open={!!editing}
        title={editing === 'new' ? 'Nuevo deportista' : `Editar @${editing?.username}`}
        fields={fields(editing && editing !== 'new')}
        initial={editing && editing !== 'new' ? { ...editing, mainSport: editing.main_sport } : null}
        onClose={() => setEditing(null)}
        onSubmit={save}
      />
    </div>
  )
}
