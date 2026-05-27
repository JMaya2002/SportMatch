// client/src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState(false)

  useEffect(() => {
    api.publicStats().then(setStats).catch(() => setStatsError(true))
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand via-emerald-500 to-emerald-700 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center">
          <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold tracking-wide mb-4">
            Conecta · Juega · Reserva
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">
            Encuentra con quién<br/>hacer deporte
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mt-5 max-w-2xl mx-auto">
            Encuentra jugadores, equipos y clubes cerca de ti.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/meetups">
              <Button size="lg" className="bg-white !text-brand hover:bg-slate-100 w-full sm:w-auto">
                Ver quedadas
              </Button>
            </Link>
            {!user && (
              <Link to="/register">
                <Button size="lg" variant="accent" className="w-full sm:w-auto">
                  Únete gratis →
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* CONTADORES EN VIVO */}
      <section className="bg-slate-900 text-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-brand">
                {statsError ? '?' : stats ? stats.active_players.toLocaleString('es-ES') : '—'}
              </div>
              <div className="text-sm text-slate-400 mt-1">Jugadores activos</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-brand">
                {statsError ? '?' : stats ? stats.clubs_count.toLocaleString('es-ES') : '—'}
              </div>
              <div className="text-sm text-slate-400 mt-1">Clubes</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-brand">
                {statsError ? '?' : stats ? stats.meetups_this_week.toLocaleString('es-ES') : '—'}
              </div>
              <div className="text-sm text-slate-400 mt-1">Quedadas esta semana</div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPORTES */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">¿Qué deporte practicas?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { sport: 'futbol',     emoji: '⚽', label: 'Fútbol' },
            { sport: 'padel',      emoji: '🎾', label: 'Pádel' },
            { sport: 'baloncesto', emoji: '🏀', label: 'Baloncesto' },
            { sport: 'tenis',      emoji: '🎾', label: 'Tenis' },
            { sport: 'running',    emoji: '🏃', label: 'Running' },
            { sport: 'ciclismo',   emoji: '🚴', label: 'Ciclismo' },
            { sport: 'fitness',    emoji: '💪', label: 'Fitness' },
            { sport: 'senderismo', emoji: '🥾', label: 'Senderismo' },
          ].map(s => (
            <Link key={s.sport} to={`/meetups?sport=${s.sport}`}>
              <Card className="text-center hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                <div className="text-4xl mb-2">{s.emoji}</div>
                <div className="font-semibold text-slate-800">{s.label}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA dos columnas */}
      <section className="max-w-5xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="text-3xl">🤝</div>
          <h3 className="text-xl font-bold mt-2">Crea o únete a quedadas</h3>
          <p className="text-slate-600 mt-2 mb-4">
            Encuentra gente de tu nivel para jugar partidos, entrenar o salir a correr.
          </p>
          <Link to="/meetups">
            <Button variant="primary">Explorar quedadas</Button>
          </Link>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-3xl">🏟️</div>
          <h3 className="text-xl font-bold mt-2">Reserva pistas al instante</h3>
          <p className="text-slate-600 mt-2 mb-4">
            Disponibilidad en tiempo real y pago seguro. Sin llamadas, sin esperas.
          </p>
          <Link to="/clubs">
            <Button variant="accent">Ver clubs</Button>
          </Link>
        </Card>
      </section>
    </div>
  )
}
