// client/src/components/ui/Badge.jsx
const levelColors = {
  principiante: 'bg-sky-100 text-sky-700 ring-sky-200',
  intermedio:   'bg-amber-100 text-amber-800 ring-amber-200',
  avanzado:     'bg-rose-100 text-rose-700 ring-rose-200',
}

export function Badge({ children, level, variant, className = '' }) {
  let color = 'bg-slate-100 text-slate-700 ring-slate-200'
  if (level) color = levelColors[level] || color
  if (variant === 'brand') color = 'bg-brand-light text-brand-dark ring-emerald-200'
  if (variant === 'accent') color = 'bg-orange-100 text-orange-800 ring-orange-200'
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ring-1 ${color} ${className}`}>
      {children}
    </span>
  )
}
