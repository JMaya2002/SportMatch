import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'

export default function BookingCancel() {
  return (
    <div className="max-w-md mx-auto p-4 mt-10 text-center">
      <Card>
        <div className="text-5xl mb-3">❌</div>
        <h1 className="text-2xl font-bold">Pago cancelado</h1>
        <p className="text-slate-600 mt-2">No se cobró nada. Puedes volver a intentarlo cuando quieras.</p>
        <Link to="/clubs"><Button variant="primary" className="mt-4">Volver a clubs</Button></Link>
      </Card>
    </div>
  )
}
