import { motion } from 'framer-motion'
import { Calendar, AlertCircle } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import { Badge, priorityColor, EmptyState } from '../ui'

function dueDateLabel(date) {
  if (isToday(date))    return { text: 'Today',    color: 'text-amber-400' }
  if (isTomorrow(date)) return { text: 'Tomorrow', color: 'text-sky-400' }
  if (isPast(date))     return { text: 'Overdue',  color: 'text-red-400' }
  const days = differenceInDays(date, new Date())
  return { text: `In ${days}d`, color: 'text-slate-500' }
}

export default function UpcomingWidget({ tasks = [] }) {
  const upcoming = tasks
    .filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 6)

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
        <Calendar size={15} className="text-slate-500" />
        <h2 className="text-sm font-semibold text-white">Upcoming</h2>
        {upcoming.some(t => isPast(new Date(t.due_date))) && (
          <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
            <AlertCircle size={12} />
            Overdue
          </span>
        )}
      </div>

      <div className="p-2">
        {upcoming.length === 0 ? (
          <EmptyState icon="📅" title="No upcoming tasks" description="Tasks with due dates appear here" />
        ) : (
          upcoming.map((task, i) => {
            const due   = new Date(task.due_date)
            const label = dueDateLabel(due)
            const overdue = isPast(due) && !isToday(due)

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                  hover:bg-white/[0.03] transition-all group
                  ${overdue ? 'border border-red-500/10' : ''}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  overdue ? 'bg-red-400' : isToday(due) ? 'bg-amber-400' : 'bg-slate-600'
                }`} />
                <p className="text-sm text-slate-300 flex-1 truncate">{task.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {task.priority && (
                    <Badge variant={priorityColor[task.priority]}>
                      {task.priority}
                    </Badge>
                  )}
                  <span className={`text-xs font-medium ${label.color}`}>
                    {label.text}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}