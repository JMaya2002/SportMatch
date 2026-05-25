// client/src/pages/Register.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { AgeCheckbox } from '../components/forms/AgeCheckbox.jsx'
import { SPORTS, LEVELS } from '../components/forms/FilterBar.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', name: '',
    age: '', city: '',
    mainSport: 'padel', level: 'intermedio',
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="Edad" type="number" min={18} required value={form.age} onChange={e => update('age', e.target.value)} />
            <Input label="Ciudad" required value={form.city} onChange={e => update('city', e.target.value)} placeholder="Barcelona" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Deporte" options={SPORTS.filter(s => s.value)} value={form.mainSport} onChange={e => update('mainSport', e.target.value)} />
            <Select label="Nivel"   options={LEVELS.filter(s => s.value)} value={form.level}     onChange={e => update('level', e.target.value)} />
          </div>
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
