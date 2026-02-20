import { motion } from 'framer-motion'

const variants = {
  primary:   'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40',
  secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
  danger:    'bg-red-600/80 hover:bg-red-500 text-white shadow-lg shadow-red-900/40',
  ghost:     'hover:bg-white/5 text-slate-300 hover:text-white',
  success:   'bg-emerald-600/80 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3.5 py-1.5 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 cursor-pointer select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </motion.button>
  )
}