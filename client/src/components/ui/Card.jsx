// client/src/components/ui/Card.jsx
export function Card({ children, className = '', as: As = 'div', ...props }) {
  return (
    <As className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${className}`} {...props}>
      {children}
    </As>
  )
}
