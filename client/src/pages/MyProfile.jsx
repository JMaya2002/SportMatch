// client/src/pages/MyProfile.jsx
import { useState } from 'react'

const POSITIONS_BY_SPORT = {
  futbol:     ['Portero', 'Defensa', 'Centrocampista', 'Delantero'],
  baloncesto: ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'],
  padel:      ['Drive', 'Revés'],
  tenis:      ['Fondo', 'Red'],
  futsal:     ['Portero', 'Cierre', 'Ala', 'Pívot'],
}

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
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api, API_MODE } from '../api/client.js'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { LEVELS } from '../components/forms/FilterBar.jsx'
import { SportPicker } from '../components/forms/SportPicker.jsx'
import { SearchableSelect } from '../components/ui/SearchableSelect.jsx'
import { PROVINCES, CITIES_BY_PROVINCE } from '../data/locations.js'

export default function MyProfile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    province: user?.province || '',
    sports: user?.sports?.length ? user.sports : [user?.main_sport].filter(Boolean),
    level: user?.level || 'intermedio',
    bio: user?.bio || '',
    position:     user?.position || '',
    availability: user?.availability || [],
    objectives:   user?.objectives || [],
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const PROVINCE_OPTIONS = [
    { value: '', label: 'Sin provincia' },
    ...PROVINCES.map(p => ({ value: p, label: p })),
  ]
  const cityOptions = form.province
    ? [{ value: '', label: 'Sin ciudad' }, ...(CITIES_BY_PROVINCE[form.province] || []).map(c => ({ value: c, label: c }))]
    : [{ value: '', label: 'Primero elige provincia' }]

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
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect
              label="Provincia"
              options={PROVINCE_OPTIONS}
              value={form.province}
              onChange={p => setForm(f => ({ ...f, province: p, city: '' }))}
              placeholder="Sin provincia"
            />
            <SearchableSelect
              label="Ciudad"
              options={cityOptions}
              value={form.city}
              onChange={c => update('city', c)}
              placeholder="Sin ciudad"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Deportes principales <span className="text-slate-400">(hasta 3)</span>
            </span>
            <SportPicker value={form.sports} onChange={v => update('sports', v)} />
          </div>
          <Select label="Nivel" options={LEVELS.filter(s => s.value)} value={form.level} onChange={e => update('level', e.target.value)} />
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Bio</span>
            <textarea
              rows={3}
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>
          {POSITIONS_BY_SPORT[form.sports?.[0]] && (
            <Select
              label="Posición habitual"
              options={[
                { value: '', label: 'Sin posición' },
                ...POSITIONS_BY_SPORT[form.sports[0]].map(p => ({ value: p, label: p }))
              ]}
              value={form.position || ''}
              onChange={e => update('position', e.target.value)}
            />
          )}
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">Disponibilidad</span>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABILITY_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.availability || []).includes(opt.value)}
                    onChange={e => {
                      if (e.target.checked) update('availability', [...(form.availability || []), opt.value])
                      else update('availability', (form.availability || []).filter(v => v !== opt.value))
                    }}
                    className="rounded border-slate-300 text-brand focus:ring-brand/30"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">Objetivos</span>
            <div className="flex flex-wrap gap-2">
              {OBJECTIVE_OPTIONS.map(opt => {
                const selected = (form.objectives || []).includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (selected) update('objectives', (form.objectives || []).filter(v => v !== opt.value))
                      else update('objectives', [...(form.objectives || []), opt.value])
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      selected
                        ? 'bg-brand border-brand text-white'
                        : 'border-slate-300 text-slate-700 hover:border-brand hover:text-brand'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
          {msg && <p className="text-sm text-brand-dark font-medium">{msg}</p>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
