// client/src/components/layout/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Avatar } from '../ui/Avatar.jsx'
import { Button } from '../ui/Button.jsx'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🏆</span>
          <span className="text-brand">Sportivo</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/meetups" className="hidden sm:inline text-sm text-slate-700 hover:text-brand">Quedadas</Link>
          <Link to="/clubs"   className="hidden sm:inline text-sm text-slate-700 hover:text-brand">Clubs</Link>
          <Link to="/users"   className="hidden sm:inline text-sm text-slate-700 hover:text-brand">Deportistas</Link>
          {user ? (
            <>
              {user.is_admin && (
                <Link to="/admin" className="hidden sm:inline text-sm font-semibold text-accent hover:underline">🛡️ Admin</Link>
              )}
              <Link to={`/@${user.username}`} className="flex items-center gap-2">
                <Avatar src={user.avatar_url} name={user.name} size="sm" />
                <span className="hidden sm:inline text-sm font-medium">{user.name.split(' ')[0]}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Salir</Button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm text-slate-700 hover:text-brand">Entrar</Link>
              <Link to="/register">
                <Button size="sm" variant="primary">Regístrate</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
