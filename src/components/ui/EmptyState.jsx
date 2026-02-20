import Button from './Button'

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon && (
        <div className="text-4xl mb-4 opacity-40">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm" variant="secondary">
          {action.label}
        </Button>
      )}
    </div>
  )
}