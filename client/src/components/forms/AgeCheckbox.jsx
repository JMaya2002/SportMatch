// client/src/components/forms/AgeCheckbox.jsx
export function AgeCheckbox({ checked, onChange, error }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-brand"
      />
      <span className="text-sm text-slate-700">
        Confirmo que tengo <strong>18 años o más</strong>. SportMatch es solo para mayores de edad.
      </span>
      {error && <span className="text-sm text-rose-600 ml-2">{error}</span>}
    </label>
  )
}
