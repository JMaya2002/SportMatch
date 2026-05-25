// client/src/components/forms/FilterBar.jsx
import { Select } from '../ui/Select.jsx'
import { Input } from '../ui/Input.jsx'

export const SPORTS = [
  { value: '',           label: 'Todos los deportes' },
  { value: 'futbol',     label: '⚽ Fútbol' },
  { value: 'padel',      label: '🎾 Pádel' },
  { value: 'baloncesto', label: '🏀 Baloncesto' },
  { value: 'running',    label: '🏃 Running' },
  { value: 'tenis',      label: '🎾 Tenis' },
  { value: 'ciclismo',   label: '🚴 Ciclismo' },
  { value: 'fitness',    label: '💪 Fitness' },
  { value: 'senderismo', label: '🥾 Senderismo' },
]
export const LEVELS = [
  { value: '',             label: 'Todos los niveles' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio',   label: 'Intermedio' },
  { value: 'avanzado',     label: 'Avanzado' },
]

export function FilterBar({ filters, onChange, showLevel = true, showCity = true, showSport = true }) {
  function update(key, value) { onChange({ ...filters, [key]: value }) }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {showSport && <Select label="Deporte" options={SPORTS} value={filters.sport || ''} onChange={e => update('sport', e.target.value)} />}
      {showLevel && <Select label="Nivel"   options={LEVELS} value={filters.level || ''} onChange={e => update('level', e.target.value)} />}
      {showCity  && <Input  label="Ciudad"  placeholder="Cualquier ciudad" value={filters.city || ''} onChange={e => update('city', e.target.value)} />}
    </div>
  )
}
