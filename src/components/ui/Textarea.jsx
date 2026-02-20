import { forwardRef } from 'react'

const Textarea = forwardRef(({
  label,
  error,
  hint,
  rows = 3,
  placeholder,
  disabled = false,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}

      <textarea
        ref={ref}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white
          placeholder:text-slate-500 outline-none transition-all duration-200
          resize-none disabled:opacity-40 disabled:cursor-not-allowed
          ${error
            ? 'border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
            : 'border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20'
          }
          ${className}
        `}
        {...props}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
})

Textarea.displayName = 'Textarea'
export default Textarea