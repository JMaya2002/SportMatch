// client/src/components/forms/FilterBar.jsx
import { Select } from '../ui/Select.jsx'
import { SearchableSelect } from '../ui/SearchableSelect.jsx'
import { PROVINCES, CITIES_BY_PROVINCE } from '../../data/locations.js'

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
  { value: 'experto',      label: 'Experto' },
]

const PROVINCE_OPTIONS = [
  { value: '', label: 'Todas las provincias' },
  ...PROVINCES.map(p => ({ value: p, label: p })),
]

function getCityOptions(province) {
  const base = [{ value: '', label: 'Todas las ciudades' }]
  if (!province) return base
  const cities = CITIES_BY_PROVINCE[province] || []
  return [...base, ...cities.map(c => ({ value: c, label: c }))]
}

export function FilterBar({ filters, onChange, showLevel = true, showCity = true, showSport = true }) {
  function update(key, value) { onChange({ ...filters, [key]: value }) }

  function updateProvince(province) {
    onChange({ ...filters, province, city: '' })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {showSport && (
        <Select
          label="Deporte"
          options={SPORTS}
          value={filters.sport || ''}
          onChange={e => update('sport', e.target.value)}
        />
      )}
      {showLevel && (
        <Select
          label="Nivel"
          options={LEVELS}
          value={filters.level || ''}
          onChange={e => update('level', e.target.value)}
        />
      )}
      {showCity && (
        <>
          <SearchableSelect
            label="Provincia"
            options={PROVINCE_OPTIONS}
            value={filters.province || ''}
            onChange={updateProvince}
            placeholder="Todas las provincias"
          />
          <SearchableSelect
            label="Ciudad"
            options={getCityOptions(filters.province)}
            value={filters.city || ''}
            onChange={v => update('city', v)}
            placeholder="Todas las ciudades"
          />
        </>
      )}
    </div>
  )
}
