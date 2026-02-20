import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
}) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

  const base = `
    bg-white/[0.03] border border-white/8 rounded-2xl
    ${paddings[padding]}
    ${hover ? 'transition-all duration-200 hover:bg-white/[0.06] hover:border-white/15 cursor-pointer' : ''}
    ${className}
  `

  if (onClick) {
    return (
      <motion.div
        onClick={onClick}
        whileTap={{ scale: 0.99 }}
        className={base}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={base}>{children}</div>
}