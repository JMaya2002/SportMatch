// client/src/pages/CreateMeetup.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SPORTS, LEVELS } from '../components/forms/FilterBar.jsx'

export default function CreateMeetup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '',
    sport: 'padel', level: 'intermedio',
    city: '', location: '',
    meetup_date: '', max_players: 4,
  })
  const [loading, setLoading] = useState(false)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    const { meetup } = await api.createMeetup(form)
    navigate(`/meetups/${meetup.id}`)
  }

  return (
    <div className="max-w-md mx-auto p-4 mt-6 pb-24">
      <Card>
        <h1 className="text-2xl font-bold">Crear quedada</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Organiza tu próximo partido o entrenamiento</p>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Título" required value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ej: Partido de pádel sábado por la mañana" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Deporte" options={SPORTS.filter(s => s.value)} value={form.sport} onChange={e => update('sport', e.target.value)} />
            <Select label="Nivel"   options={LEVELS.filter(s => s.value)} value={form.level} onChange={e => update('level', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ciudad"   required value={form.city}     onChange={e => update('city', e.target.value)}     placeholder="Barcelona" />
            <Input label="Lugar"    required value={form.location} onChange={e => update('location', e.target.value)} placeholder="Club X, Pista 2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha y hora" type="datetime-local" required value={form.meetup_date} onChange={e => update('meetup_date', e.target.value)} />
            <Input label="Plazas máx." type="number" min={2} max={30} required value={form.max_players} onChange={e => update('max_players', e.target.value)} />
          </div>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Descripción</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Cuenta de qué va la quedada, nivel esperado, qué hay que llevar..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
            />
          </label>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creando...' : 'Publicar quedada'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
