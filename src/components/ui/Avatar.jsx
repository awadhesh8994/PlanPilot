export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  }

  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  // Generate a consistent color from name
  const colors = [
    'from-violet-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
  ]
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/10 ${className}`}
      />
    )
  }

  return (
    <div className={`
      ${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIndex]}
      flex items-center justify-center font-semibold text-white
      ring-2 ring-white/10 shrink-0 ${className}
    `}>
      {initials}
    </div>
  )
}