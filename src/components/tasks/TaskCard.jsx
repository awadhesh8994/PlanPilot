import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Circle, CheckCircle2, Trash2,
  Calendar, MoreHorizontal, ChevronRight
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { Badge, priorityColor, Dropdown, ConfirmDialog, useToast } from '../ui'
import useTaskStore from '../../store/useTaskStore'
import useAuthStore from '../../store/useAuthStore'

export default function TaskCard({ task, index, onOpen }) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const toast      = useToast()
  const user       = useAuthStore(s => s.user)
  const toggleTask = useTaskStore(s => s.toggleTask)
  const deleteTask = useTaskStore(s => s.deleteTask)

  const done = task.status === 'done'
  const tags = task.task_tags?.map(tt => tt.tags).filter(Boolean) || []

  const dueDateDisplay = () => {
    if (!task.due_date) return null
    const d = new Date(task.due_date)
    if (isToday(d))         return { text: 'Today',            cls: 'text-amber-400' }
    if (isPast(d) && !done) return { text: format(d, 'MMM d'), cls: 'text-red-400'   }
    return                         { text: format(d, 'MMM d'), cls: 'text-slate-500'  }
  }
  const dateInfo = dueDateDisplay()

  const handleToggle = async (e) => {
    e.stopPropagation()
    const { error } = await toggleTask(task, user.id)
    if (error) toast('Failed to update task', 'error')
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteTask(task.id, user.id)
    setDeleting(false)
    if (error) toast('Failed to delete task', 'error')
    else { toast('Task deleted', 'success'); setShowDelete(false) }
  }

  const menuItems = [
    { label: done ? 'Mark as todo' : 'Mark as done', icon: <CheckCircle2 size={14} />, onClick: handleToggle },
    { divider: true },
    { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: (e) => { e.stopPropagation(); setShowDelete(true) } },
  ]

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        onClick={() => onOpen(task.id)}
        className={`group flex items-start gap-3 px-4 py-4 rounded-2xl border
          cursor-pointer transition-all duration-200 hover:border-white/10 hover:bg-white/[0.03]
          ${done ? 'bg-transparent border-white/[0.03]' : 'bg-white/[0.02] border-white/[0.06]'}`}
      >
        <motion.button whileTap={{ scale: 0.85 }} onClick={handleToggle}
          className={`mt-0.5 shrink-0 transition-colors ${done ? 'text-emerald-400' : 'text-slate-600 hover:text-violet-400'}`}
        >
          {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </motion.button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug transition-all ${done ? 'line-through text-slate-600' : 'text-slate-200'}`}>
            {task.title}
          </p>
          {task.description && !done && (
            <p className="text-xs text-slate-600 mt-1 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.priority && <Badge variant={priorityColor[task.priority]} dot>{task.priority}</Badge>}
            {dateInfo && (
              <span className={`flex items-center gap-1 text-xs ${dateInfo.cls}`}>
                <Calendar size={11} />{dateInfo.text}
              </span>
            )}
            {tags.map(tag => (
              <span key={tag.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                style={{ color: tag.color, borderColor: tag.color + '40', backgroundColor: tag.color + '15' }}>
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
          <div onClick={e => e.stopPropagation()}>
            <Dropdown align="right"
              trigger={
                <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                  <MoreHorizontal size={15} />
                </button>
              }
              items={menuItems}
            />
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete task?" description="This will permanently delete the task and all its subtasks."
        confirmLabel="Delete"
      />
    </>
  )
}