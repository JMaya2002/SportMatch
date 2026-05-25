import { Link, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'

export default function BookingSuccess() {
  const { id } = useParams()
  return (
    <div className="max-w-md mx-auto p-4 mt-10 text-center">
      <Card>
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-2xl font-bold">Reserva confirmada</h1>
        <p className="text-slate-600 mt-2">Reserva #{id} pagada correctamente.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Link to="/me/bookings"><Button variant="primary">Mis reservas</Button></Link>
          <Link to="/clubs"><Button variant="outline">Seguir explorando</Button></Link>
        </div>
      </Card>
    </div>
  )
}
