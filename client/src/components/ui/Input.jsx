// client/src/components/ui/Input.jsx
export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <input
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition ${error ? 'border-rose-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
      {error && <span className="block text-sm text-rose-600 mt-1">{error}</span>}
    </label>
  )
}
