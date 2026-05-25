// client/src/components/ui/SportIcon.jsx
// Iconos emoji para cada deporte — rápido y reconocible en una demo
const ICONS = {
  futbol:     '⚽',
  padel:      '🎾',
  baloncesto: '🏀',
  running:    '🏃',
  tenis:      '🎾',
  ciclismo:   '🚴',
  fitness:    '💪',
  senderismo: '🥾',
}

const LABELS = {
  futbol: 'Fútbol', padel: 'Pádel', baloncesto: 'Baloncesto',
  running: 'Running', tenis: 'Tenis', ciclismo: 'Ciclismo',
  fitness: 'Fitness', senderismo: 'Senderismo',
}

export function SportIcon({ sport, withLabel = false, className = '' }) {
  return (
    <span className={className}>
      <span aria-hidden>{ICONS[sport] || '🏅'}</span>
      {withLabel && <span className="ml-1">{LABELS[sport] || sport}</span>}
    </span>
  )
}

export function sportLabel(sport) { return LABELS[sport] || sport }
