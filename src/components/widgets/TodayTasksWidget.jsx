import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Circle, CheckCircle2, Flag, Calendar } from 'lucide-react'
import { Badge, priorityColor, EmptyState } from '../ui'
import { format } from 'date-fns'

function TaskItem({ task, onToggle }) {
  const done = task.status === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200
        hover:bg-white/[0.03] group border border-transparent hover:border-white/[0.05]`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={`mt-0.5 shrink-0 transition-colors duration-200 ${
          done ? 'text-emerald-400' : 'text-slate-600 hover:text-violet-400'
        }`}
      >
        {done
          ? <CheckCircle2 size={18} />
          : <Circle size={18} />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug transition-all duration-200 ${
          done ? 'line-through text-slate-600' : 'text-slate-200'
        }`}>
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {task.priority && (
            <Badge variant={priorityColor[task.priority]} dot>
              {task.priority}
            </Badge>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1 text-[10px] text-slate-600">
              <Calendar size={10} />
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function TodayTasksWidget({ tasks = [], onToggle, onAdd }) {
  const pending   = tasks.filter(t => t.status !== 'done')
  const completed = tasks.filter(t => t.status === 'done')
  const progress  = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Today's Tasks</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {completed.length} of {tasks.length} completed
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20
            border border-violet-500/20 text-violet-300 text-xs font-medium
            hover:bg-violet-600/30 transition-all"
        >
          <Plus size={13} />
          Add task
        </button>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="px-2 py-2 max-h-80 overflow-y-auto">
        {tasks.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No tasks for today"
            description="Add your first task to get started"
            action={{ label: 'Add task', onClick: onAdd }}
          />
        ) : (
          <AnimatePresence>
            {pending.map(task => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} />
            ))}
            {completed.length > 0 && (
              <div className="px-3 py-2">
                <p className="text-[10px] text-slate-700 uppercase tracking-widest font-semibold">
                  Completed ({completed.length})
                </p>
              </div>
            )}
            {completed.map(task => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}