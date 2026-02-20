export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-9 h-9' }
  return (
    <div className={`${sizes[size]} border-2 border-white/10 border-t-violet-500 rounded-full animate-spin ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0e0e1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}

export function SkeletonLine({ className = '' }) {
  return (
    <div className={`bg-white/5 rounded-lg animate-pulse ${className}`} />
  )
}

export function TaskSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
      <div className="w-5 h-5 rounded-full bg-white/5 animate-pulse shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
    </div>
  )
}