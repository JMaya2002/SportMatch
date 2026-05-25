// client/src/pages/MyProfile.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api, API_MODE } from '../api/client.js'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { SPORTS, LEVELS } from '../components/forms/FilterBar.jsx'

export default function MyProfile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    mainSport: user?.main_sport || 'padel',
    level: user?.level || 'intermedio',
    bio: user?.bio || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save(e) {
    e.preventDefault()
    setSaving(true); setMsg(null)
    const { user: updated } = await api.updateMe(form)
    setUser(updated)
    setMsg('Guardado ✓')
    setSaving(false)
    setTimeout(() => setMsg(null), 2000)
  }

  if (!user) return <p className="p-4">Necesitas iniciar sesión.</p>

  return (
    <div className="max-w-md mx-auto p-4 mt-6 pb-24 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Link to={`/@${user.username}`}><Card className="text-center text-xs hover:shadow-md transition">
          <div className="text-2xl">👁️</div>Mi perfil público
        </Card></Link>
        <Link to="/me/friends"><Card className="text-center text-xs hover:shadow-md transition">
          <div className="text-2xl">🤝</div>Amigos
        </Card></Link>
        <Link to="/me/clubs"><Card className="text-center text-xs hover:shadow-md transition">
          <div className="text-2xl">🏟️</div>Mis clubes
        </Card></Link>
        <Link to="/me/bookings"><Card className="text-center text-xs hover:shadow-md transition">
          <div className="text-2xl">📅</div>Reservas
        </Card></Link>
      </div>
      <Card>
        <h1 className="text-2xl font-bold mb-4">Mi perfil</h1>
        <div className="flex items-center gap-4 mb-6">
          <Avatar src={user.avatar_url} name={user.name} size="lg" />
          {API_MODE === 'real' ? (
            <label className="text-sm text-brand font-medium hover:underline cursor-pointer">
              Cambiar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const { url } = await api.uploadAvatar(file)
                    setUser({ ...user, avatar_url: url })
                    setMsg('Foto actualizada ✓')
                    setTimeout(() => setMsg(null), 2000)
                  } catch (err) {
                    setMsg(err.message || 'No se pudo subir la foto')
                  }
                }}
              />
            </label>
          ) : (
            <span className="text-xs text-slate-400">(disponible al conectar el backend)</span>
          )}
        </div>
        <form onSubmit={save} className="space-y-3">
          <Input label="Nombre" value={form.name} onChange={e => update('name', e.target.value)} />
          <Input label="Ciudad" value={form.city} onChange={e => update('city', e.target.value)} />
          <Select label="Deporte principal" options={SPORTS.filter(s => s.value)} value={form.mainSport} onChange={e => update('mainSport', e.target.value)} />
          <Select label="Nivel"              options={LEVELS.filter(s => s.value)} value={form.level}     onChange={e => update('level', e.target.value)} />
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Bio</span>
            <textarea
              rows={3}
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>
          {msg && <p className="text-sm text-brand-dark font-medium">{msg}</p>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
