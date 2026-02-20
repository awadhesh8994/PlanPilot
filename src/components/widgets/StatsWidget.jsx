import { motion } from 'framer-motion'
import { CheckCircle, Clock, Flame, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  const colors = {
    violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400' },
    sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     icon: 'text-sky-400' },
  }
  const c = colors[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={`bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 flex items-start gap-4`}
    >
      <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-display">{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
      </div>
    </motion.div>
  )
}

export default function StatsWidget({ stats }) {
  const items = [
    {
      icon: CheckCircle,
      label: 'Completed today',
      value: stats?.completedToday ?? 0,
      sub: 'tasks done',
      color: 'emerald',
      delay: 0.1,
    },
    {
      icon: Clock,
      label: 'Pending tasks',
      value: stats?.pending ?? 0,
      sub: 'to be done',
      color: 'sky',
      delay: 0.15,
    },
    {
      icon: Flame,
      label: 'Current streak',
      value: `${stats?.streak ?? 0}d`,
      sub: 'days in a row',
      color: 'amber',
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      label: 'Total completed',
      value: stats?.totalCompleted ?? 0,
      sub: 'all time',
      color: 'violet',
      delay: 0.25,
    },
  ]

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  )
}