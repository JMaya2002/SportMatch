// client/src/pages/admin/CrudModal.jsx
// Modal sencillo para crear/editar registros. Recibe un schema {field, label, type, options}.
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Select } from '../../components/ui/Select.jsx'

export function CrudModal({ open, title, fields, initial, onClose, onSubmit }) {
  const [form, setForm] = useState({})
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      const base = {}
      for (const f of fields) base[f.name] = initial?.[f.name] ?? f.default ?? ''
      setForm(base); setError(null)
    }
  }, [open, initial, fields])

  if (!open) return null

  function update(name, value) { setForm(f => ({ ...f, [name]: value })) }

  async function submit(e) {
    e.preventDefault()
    setError(null); setSaving(true)
    try {
      // Convertir números y booleanos según schema
      const out = { ...form }
      for (const f of fields) {
        if (f.type === 'number' && out[f.name] !== '') out[f.name] = Number(out[f.name])
        if (f.type === 'checkbox') out[f.name] = !!out[f.name]
      }
      await onSubmit(out)
      onClose()
    } catch (err) {
      setError(err.message || 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          {fields.map(f => (
            <div key={f.name}>
              {f.type === 'select' ? (
                <Select label={f.label} options={f.options} value={form[f.name] ?? ''} onChange={e => update(f.name, e.target.value)} />
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!form[f.name]} onChange={e => update(f.name, e.target.checked)} className="accent-brand" />
                  {f.label}
                </label>
              ) : f.type === 'textarea' ? (
                <label className="block">
                  <span className="block text-sm font-medium text-slate-700 mb-1">{f.label}</span>
                  <textarea rows={3} value={form[f.name] ?? ''} onChange={e => update(f.name, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </label>
              ) : (
                <Input
                  label={f.label}
                  type={f.type || 'text'}
                  value={form[f.name] ?? ''}
                  onChange={e => update(f.name, e.target.value)}
                  required={f.required}
                  placeholder={f.placeholder}
                  hint={f.hint}
                />
              )}
            </div>
          ))}
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
