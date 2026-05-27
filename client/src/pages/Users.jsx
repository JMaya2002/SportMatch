// client/src/pages/Users.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { FilterBar } from '../components/forms/FilterBar.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Avatar } from '../components/ui/Avatar.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { SportIcon, sportLabel } from '../components/ui/SportIcon.jsx'

export default function Users() {
  const [filters, setFilters] = useState({ sport: '', level: '', city: '', province: '' })
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.listUsers(filters)
      .then(({ users }) => setUsers(users))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Deportistas</h1>
        <p className="text-slate-500">Encuentra gente de tu nivel y ciudad</p>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />
      {loading ? (
        <p className="text-slate-500">Cargando deportistas...</p>
      ) : users.length === 0 ? (
        <Card className="text-center text-slate-500 py-12">
          <div className="text-4xl mb-2">🔍</div>
          No hay deportistas que coincidan con tus filtros.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {users.map(u => (
            <Link key={u.id} to={`/@${u.username}`}>
              <Card className="flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer h-full">
                <Avatar src={u.avatar_url} name={u.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{u.name}</div>
                  <div className="text-sm text-slate-500 truncate">@{u.username} · {u.city}</div>
                  <div className="mt-1.5 flex gap-1.5 text-xs flex-wrap">
                    <Badge variant="brand"><SportIcon sport={u.main_sport} /> {sportLabel(u.main_sport)}</Badge>
                    <Badge level={u.level}>{u.level}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
