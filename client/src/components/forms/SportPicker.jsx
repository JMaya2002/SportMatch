// client/src/components/forms/SportPicker.jsx

const SPORT_CHIPS = [
  { value: 'futbol',     emoji: '⚽', label: 'Fútbol' },
  { value: 'padel',      emoji: '🎾', label: 'Pádel' },
  { value: 'baloncesto', emoji: '🏀', label: 'Baloncesto' },
  { value: 'tenis',      emoji: '🎾', label: 'Tenis' },
  { value: 'running',    emoji: '🏃', label: 'Running' },
  { value: 'ciclismo',   emoji: '🚴', label: 'Ciclismo' },
  { value: 'fitness',    emoji: '💪', label: 'Fitness' },
  { value: 'senderismo', emoji: '🥾', label: 'Senderismo' },
]

const MAX = 3

export function SportPicker({ value = [], onChange }) {
  function toggle(sport) {
    if (value.includes(sport)) {
      onChange(value.filter(s => s !== sport))
    } else if (value.length < MAX) {
      onChange([...value, sport])
    }
  }

  const count = value.length
  const atMax = count >= MAX

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {SPORT_CHIPS.map(({ value: sport, emoji, label }) => {
          const selected = value.includes(sport)
          const disabled = !selected && atMax
          return (
            <button
              key={sport}
              type="button"
              onClick={() => toggle(sport)}
              disabled={disabled}
              className={[
                'flex flex-col items-center gap-1 rounded-lg border py-2 px-1 text-xs font-medium transition',
                selected
                  ? 'bg-brand border-brand text-white shadow-sm'
                  : disabled
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                    : 'border-slate-200 text-slate-700 hover:border-brand hover:text-brand cursor-pointer',
              ].join(' ')}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </button>
          )
        })}
      </div>
      <p className={`text-xs mt-2 ${atMax ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
        {count}/{MAX}{atMax ? ' (máximo)' : count === 0 ? ' — selecciona al menos 1' : ''}
      </p>
    </div>
  )
}
