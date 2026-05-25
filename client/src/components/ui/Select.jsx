// client/src/components/ui/Select.jsx
export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>}
      <select
        className={`w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition ${error ? 'border-rose-500' : 'border-slate-300'} ${className}`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="block text-sm text-rose-600 mt-1">{error}</span>}
    </label>
  )
}
