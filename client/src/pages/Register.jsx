// client/src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { AgeCheckbox } from '../components/forms/AgeCheckbox.jsx'
import { LEVELS } from '../components/forms/FilterBar.jsx'
import { SportPicker } from '../components/forms/SportPicker.jsx'
import { SearchableSelect } from '../components/ui/SearchableSelect.jsx'
import { PROVINCES, CITIES_BY_PROVINCE } from '../data/locations.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', name: '',
    age: '', city: '', province: '',
    sports: ['padel'], level: 'intermedio',
    ageConfirmed: false,
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await register({ ...form, age: Number(form.age) })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const PROVINCE_OPTIONS = [
    { value: '', label: 'Selecciona provincia' },
    ...PROVINCES.map(p => ({ value: p, label: p })),
  ]
  const cityOptions = form.province
    ? [{ value: '', label: 'Selecciona ciudad' }, ...(CITIES_BY_PROVINCE[form.province] || []).map(c => ({ value: c, label: c }))]
    : [{ value: '', label: 'Primero elige provincia' }]

  const canSubmit = form.ageConfirmed && Number(form.age) >= 18

  return (
    <div className="max-w-md mx-auto p-4 mt-6">
      <Card>
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Únete a la comunidad deportiva</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nombre de usuario" required hint="Solo letras, números y _" value={form.username} onChange={e => update('username', e.target.value)} placeholder="tu_usuario" />
          <Input label="Nombre completo"     required value={form.name}     onChange={e => update('name', e.target.value)} />
          <Input label="Email" type="email"   required value={form.email}    onChange={e => update('email', e.target.value)} />
          <Input label="Contraseña" type="password" required minLength={8} hint="Mínimo 8 caracteres" value={form.password} onChange={e => update('password', e.target.value)} />
          <Input label="Edad" type="number" min={18} required value={form.age} onChange={e => update('age', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect
              label="Provincia"
              options={PROVINCE_OPTIONS}
              value={form.province}
              onChange={p => setForm(f => ({ ...f, province: p, city: '' }))}
              placeholder="Selecciona provincia"
            />
            <SearchableSelect
              label="Ciudad"
              options={cityOptions}
              value={form.city}
              onChange={c => update('city', c)}
              placeholder="Selecciona ciudad"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Deportes principales <span className="text-slate-400">(hasta 3)</span>
            </span>
            <SportPicker value={form.sports} onChange={v => update('sports', v)} />
          </div>
          <Select label="Nivel" options={LEVELS.filter(s => s.value)} value={form.level} onChange={e => update('level', e.target.value)} />
          <AgeCheckbox checked={form.ageConfirmed} onChange={v => update('ageConfirmed', v)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={loading || !canSubmit} className="w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
          {!canSubmit && form.ageConfirmed === false && (
            <p className="text-xs text-center text-slate-500">Debes confirmar que tienes 18 años o más</p>
          )}
        </form>
        <p className="text-sm text-center mt-4 text-slate-600">
          ¿Ya tienes cuenta? <Link to="/login" className="text-brand font-semibold">Inicia sesión</Link>
        </p>
      </Card>
    </div>
  )
}
