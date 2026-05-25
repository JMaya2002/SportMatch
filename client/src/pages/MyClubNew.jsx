// client/src/pages/MyClubNew.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Button } from '../components/ui/Button.jsx'

export default function MyClubNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', city: '', address: '', description: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function up(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setError(null); setSaving(true)
    try {
      const { club } = await api.createOwnClub(form)
      navigate(`/me/clubs/${club.id}`)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-md mx-auto p-4 mt-6 pb-24">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Nuevo club</h1>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Nombre del club" required value={form.name} onChange={e => up('name', e.target.value)} />
          <Input label="Ciudad"          required value={form.city} onChange={e => up('city', e.target.value)} />
          <Input label="Dirección"                value={form.address} onChange={e => up('address', e.target.value)} />
          <Input label="Teléfono"                 value={form.phone}   onChange={e => up('phone', e.target.value)} />
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Descripción</span>
            <textarea rows={3} value={form.description} onChange={e => up('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={saving} className="w-full">{saving ? 'Creando...' : 'Crear club'}</Button>
        </form>
      </Card>
    </div>
  )
}
