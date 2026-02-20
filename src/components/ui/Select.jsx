import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(({
  label,
  error,
  options = [],
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

      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          className={`
            appearance-none w-full bg-white/5 border rounded-xl px-4 py-2.5
            text-sm text-white outline-none transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer pr-10
            ${error
              ? 'border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
              : 'border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#16162a]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

Select.displayName = 'Select'
export default Select