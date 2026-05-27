// client/src/components/ui/SearchableSelect.jsx
import { useState, useRef, useEffect } from 'react'

export function SearchableSelect({ label, value, options, onChange, placeholder = 'Buscar...' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  function select(opt) {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setQuery('') }}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-left text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-slate-400 ml-2">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 text-xs">🔍</span>
              <input
                autoFocus
                className="flex-1 text-sm bg-transparent outline-none"
                placeholder="Buscar..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">Sin resultados</li>
            )}
            {filtered.map(opt => (
              <li
                key={opt.value}
                onClick={() => select(opt)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-brand/10 ${
                  opt.value === value ? 'bg-brand/10 font-medium text-brand' : 'text-slate-700'
                }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
