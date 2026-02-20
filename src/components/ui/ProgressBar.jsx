import { motion } from 'framer-motion'

export default function ProgressBar({
  value = 0,       // 0-100
  label,
  showPercent = false,
  color = 'violet',
  size = 'md',
  className = '',
}) {
  const clampedValue = Math.min(100, Math.max(0, value))

  const colors = {
    violet:  'from-violet-500 to-purple-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber:   'from-amber-500 to-orange-500',
    sky:     'from-sky-500 to-blue-500',
    pink:    'from-pink-500 to-rose-500',
  }

  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' }

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showPercent && (
            <span className="text-xs font-medium text-slate-300">{Math.round(clampedValue)}%</span>
          )}
        </div>
      )}

      <div className={`w-full ${heights[size]} bg-white/5 rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]}`}
        />
      </div>
    </div>
  )
}