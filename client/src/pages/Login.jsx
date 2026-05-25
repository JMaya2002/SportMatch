// client/src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { MOCK_USERS } from '../mock/data.js'
import { API_MODE } from '../api/client.js'

export default function Login() {
  const { login, loginAs } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function quickLogin(username) {
    setLoading(true)
    try {
      await loginAs(username)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 mt-6">
      <Card>
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">Bienvenido de vuelta a SportMatch</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          <Input label="Contraseña" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="flex-1 h-px bg-slate-200" /> o <span className="flex-1 h-px bg-slate-200" />
        </div>
        <button className="w-full border border-slate-300 rounded-lg py-2 hover:bg-slate-50 flex items-center justify-center gap-2 text-sm font-medium">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar con Google
        </button>

        {/* Atajo demo: solo visible en modo mock */}
        {API_MODE === 'mock' && (
          <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
            <p className="text-xs text-slate-500 mb-2 font-semibold">🎬 Demo — entra como cualquier usuario:</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {MOCK_USERS.slice(0, 5).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => quickLogin(u.username)}
                  className="flex flex-col items-center min-w-[60px] hover:opacity-80"
                >
                  <Avatar src={u.avatar_url} name={u.name} size="sm" />
                  <span className="text-[10px] mt-1 text-slate-600">@{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {API_MODE === 'real' && (
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
            <p className="text-xs text-slate-500">
              💡 Datos de prueba: <code>joel@test.com</code> · <code>carlos@test.com</code> · contraseña <code>test1234</code>
            </p>
          </div>
        )}

        <p className="text-sm text-center mt-4 text-slate-600">
          ¿No tienes cuenta? <Link to="/register" className="text-brand font-semibold">Regístrate</Link>
        </p>
      </Card>
    </div>
  )
}
