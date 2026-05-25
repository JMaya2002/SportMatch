// client/src/components/ui/Avatar.jsx
export function Avatar({ src, name = '', size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 text-3xl',
  }
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white shadow`} />
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center font-bold shadow`}>
      {initials || '?'}
    </div>
  )
}
