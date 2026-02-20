const variants = {
  default:  'bg-white/8 text-slate-300',
  violet:   'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  emerald:  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  amber:    'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  red:      'bg-red-500/20 text-red-300 border border-red-500/30',
  sky:      'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  pink:     'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  slate:    'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

// Map priority/status to colors automatically
export const priorityColor = {
  low:    'emerald',
  medium: 'amber',
  high:   'red',
  urgent: 'pink',
}

export const statusColor = {
  todo:        'slate',
  in_progress: 'sky',
  done:        'emerald',
  cancelled:   'red',
}

export default function Badge({
  children,
  variant = 'default',
  dot = false,
  className = '',
}) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
      ${variants[variant]} ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-current'}`} />
      )}
      {children}
    </span>
  )
}

const dotColors = {
  violet:  'bg-violet-400',
  emerald: 'bg-emerald-400',
  amber:   'bg-amber-400',
  red:     'bg-red-400',
  sky:     'bg-sky-400',
  pink:    'bg-pink-400',
  slate:   'bg-slate-400',
}