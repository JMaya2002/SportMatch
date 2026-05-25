// client/src/components/ui/Button.jsx
export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
    accent:  'bg-accent text-white hover:bg-orange-600 shadow-sm',
    ghost:   'text-slate-700 hover:bg-slate-100',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    danger:  'bg-rose-500 text-white hover:bg-rose-600',
  }
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
}
