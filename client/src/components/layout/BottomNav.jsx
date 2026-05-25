// client/src/components/layout/BottomNav.jsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export function BottomNav() {
  const { user } = useAuth()
  const items = [
    { to: '/',         label: 'Inicio',    icon: '🏠' },
    { to: '/meetups',  label: 'Quedadas',  icon: '🤝' },
    { to: '/clubs',    label: 'Clubs',     icon: '🏟️' },
    { to: '/users',    label: 'Deportistas', icon: '👥' },
    { to: user ? `/@${user.username}` : '/login', label: 'Yo', icon: '👤' },
  ]
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around py-1.5 z-10 shadow-lg">
      {items.map(it => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/'}
          className={({ isActive }) => `flex flex-col items-center text-[10px] px-2 py-1 transition ${isActive ? 'text-brand font-semibold' : 'text-slate-500'}`}
        >
          <span className="text-lg leading-none">{it.icon}</span>
          <span className="mt-0.5">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
