// client/src/pages/MyClubs.jsx
// Listado de "mis clubes" (donde el usuario es owner) + atajo a crear/gestionar.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'

export default function MyClubs() {
  const [clubs, setClubs] = useState(null)
  const [following, setFollowing] = useState([])
  const [error, setError] = useState(null)

  async function load() {
    try {
      const my = await api.myClubs()
      setClubs(my.clubs)
      try { const f = await api.myFollowingClubs(); setFollowing(f.clubs) } catch {}
    } catch (e) { setError(e.message) }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Mis clubes</h1>
        <Link to="/me/clubs/new"><Button variant="accent">+ Nuevo club</Button></Link>
      </div>

      {error && <p className="text-rose-600 mb-3">{error}</p>}
      {!clubs && !error && <p className="text-slate-500">Cargando...</p>}
      {clubs && clubs.length === 0 && (
        <Card className="text-center text-slate-500 py-8">
          <div className="text-4xl mb-2">🏟️</div>
          No gestionas ningún club. Crea uno para empezar.
        </Card>
      )}

      <div className="space-y-2">
        {clubs?.map(c => (
          <Link key={c.id} to={`/me/clubs/${c.id}`}>
            <Card className="hover:shadow-md transition">
              <div className="flex gap-3">
                {c.cover && (
                  <div className="w-20 h-20 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${c.cover})` }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-slate-500">{c.city}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1 text-xs">
                    <Badge variant="brand">{c.venue_count} recintos</Badge>
                    <Badge>{c.court_count} pistas</Badge>
                    <Badge variant="accent">{c.followers_count} seguidores</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {following.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-8 mb-3">Clubes que sigues</h2>
          <div className="space-y-2">
            {following.map(c => (
              <Link key={c.id} to={`/clubs/${c.id}`}>
                <Card className="flex items-center gap-3 hover:shadow-md transition">
                  {c.cover && <div className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${c.cover})` }} />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.city}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
