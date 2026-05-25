// client/src/pages/ClubDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { SportIcon, sportLabel } from '../components/ui/SportIcon.jsx'

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [club, setClub] = useState(null)
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(null)

  async function reserve() {
    if (!user) { navigate('/login'); return }
    setBooking(true); setError(null)
    try {
      const { checkoutUrl } = await api.createBooking({
        courtId: selectedCourt.id,
        date,
        startHour: selectedSlot,
        endHour: selectedSlot + 1,
      })
      if (checkoutUrl && checkoutUrl !== '#demo') {
        window.location.href = checkoutUrl
      } else {
        navigate('/me/bookings')
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear la reserva')
    } finally {
      setBooking(false)
    }
  }

  useEffect(() => {
    api.getClub(id).then(({ club }) => {
      setClub(club)
      setSelectedCourt(club.courts[0])
    })
  }, [id])

  useEffect(() => {
    if (!selectedCourt) return
    api.getAvailability(selectedCourt.id, date).then(({ slots }) => setSlots(slots))
    setSelectedSlot(null)
  }, [selectedCourt, date])

  if (!club) return <p className="p-4 text-slate-500">Cargando club...</p>

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <Link to="/clubs" className="text-sm text-slate-500 hover:text-brand">← Volver a clubs</Link>

      {/* Galería */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl overflow-hidden">
        {club.photos.map((url, i) => (
          <div key={i} className="h-48 bg-cover bg-center bg-slate-200" style={{ backgroundImage: `url(${url})` }} />
        ))}
      </div>

      {/* Cabecera */}
      <Card className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{club.name}</h1>
            <p className="text-slate-500">{club.address}</p>
            <p className="text-xs text-slate-400 mt-1">
              {club.followers_count ?? 0} seguidores
              {club.venues?.length > 1 && <> · {club.venues.length} recintos</>}
            </p>
          </div>
          {club.is_owner ? (
            <Link to={`/me/clubs/${club.id}`}><Button variant="outline" size="sm">⚙️ Gestionar</Button></Link>
          ) : !user ? (
            <Link to="/login"><Button size="sm" variant="primary">Inicia sesión para seguir</Button></Link>
          ) : club.is_following ? (
            <Button size="sm" variant="outline" onClick={async () => { await api.unfollowClub?.(club.id); const { club: c } = await api.getClub(club.id); setClub(c) }}>✓ Siguiendo</Button>
          ) : (
            <Button size="sm" variant="primary" onClick={async () => { await api.followClub?.(club.id); const { club: c } = await api.getClub(club.id); setClub(c) }}>+ Seguir</Button>
          )}
        </div>
        <p className="text-slate-700 mt-2">{club.description}</p>
      </Card>

      {/* Recintos (si hay >1) */}
      {club.venues?.length > 1 && (
        <div className="mt-4 space-y-3">
          {club.venues.map(v => (
            <Card key={v.id}>
              <div className="font-semibold">{v.name}</div>
              <div className="text-xs text-slate-500">{v.address || v.city}</div>
              <div className="text-xs text-slate-400 mt-1">{v.courts.length} pistas disponibles</div>
            </Card>
          ))}
        </div>
      )}

      {/* Pistas */}
      <h2 className="text-lg font-bold mt-6 mb-3">Pistas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {club.courts.map(court => (
          <button
            key={court.id}
            onClick={() => setSelectedCourt(court)}
            className={`text-left p-3 rounded-lg border-2 transition ${selectedCourt?.id === court.id ? 'border-brand bg-brand-light' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <div className="flex items-center gap-2">
              <SportIcon sport={court.sport} className="text-2xl" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{court.name}</div>
                <div className="text-xs text-slate-500">{sportLabel(court.sport)}</div>
              </div>
            </div>
            <div className="mt-2 text-brand-dark font-bold">{court.price_per_hour}€<span className="text-xs font-normal text-slate-500">/hora</span></div>
          </button>
        ))}
      </div>

      {/* Disponibilidad */}
      {selectedCourt && (
        <>
          <div className="flex items-end justify-between mt-6 mb-3 gap-3">
            <div>
              <h2 className="text-lg font-bold">Disponibilidad</h2>
              <p className="text-sm text-slate-500">{selectedCourt.name}</p>
            </div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <Card>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {slots.map(s => (
                <button
                  key={s.hour}
                  disabled={!s.available}
                  onClick={() => setSelectedSlot(s.hour)}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    !s.available
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                      : selectedSlot === s.hour
                      ? 'bg-brand text-white shadow-md scale-105'
                      : 'bg-white border border-slate-200 hover:border-brand hover:bg-brand-light'
                  }`}
                >
                  {String(s.hour).padStart(2, '0')}:00
                </button>
              ))}
            </div>
            {selectedSlot !== null && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-slate-500">Resumen</div>
                    <div className="font-semibold">
                      {selectedCourt.name} · {date} · {String(selectedSlot).padStart(2, '0')}:00–{String(selectedSlot + 1).padStart(2, '0')}:00
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-brand-dark">
                    {selectedCourt.price_per_hour}€
                  </div>
                </div>
                <Button variant="accent" className="w-full" onClick={reserve} disabled={booking}>
                  {booking ? 'Procesando...' : `💳 Reservar y pagar ${selectedCourt.price_per_hour}€`}
                </Button>
                {error && <p className="text-xs text-rose-600 text-center mt-2">{error}</p>}
                <p className="text-xs text-center text-slate-400 mt-2">Pago seguro con Stripe · Comisión incluida</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
