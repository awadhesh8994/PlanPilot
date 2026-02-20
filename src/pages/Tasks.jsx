import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, SortAsc, CheckCircle2, Circle, Clock, AlertCircle, ChevronDown, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DashboardLayout from '../components/DashboardLayout'
import TaskDetailPanel from '../components/tasks/TaskDetailPanel'
import AddTaskModal from '../components/tasks/AddTaskModal'
import { TaskSkeleton, EmptyState, Badge, priorityColor, ConfirmDialog, Dropdown, useToast } from '../components/ui'
import useTaskStore from '../store/useTaskStore'
import useAuthStore from '../store/useAuthStore'
import { isPast, isToday } from 'date-fns'
import { Calendar, MoreHorizontal, Trash2, ChevronRight } from 'lucide-react'

// ── Sortable Task Card ────────────────────────────────────────────────────────
function SortableTaskCard({ task, index, onOpen, isDragging: isOverlay }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  const toast      = useToast()
  const user       = useAuthStore(s => s.user)
  const toggleTask = useTaskStore(s => s.toggleTask)
  const deleteTask = useTaskStore(s => s.deleteTask)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

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
      <div ref={setNodeRef} style={style}>
        <div
          onClick={() => !isDragging && onOpen(task.id)}
          className={`group flex items-start gap-3 px-4 py-4 rounded-2xl border
            cursor-pointer transition-all duration-200 select-none
            hover:border-white/10 hover:bg-white/[0.03]
            ${isDragging || isOverlay ? 'shadow-2xl shadow-black/50 border-violet-500/30 bg-white/[0.05]' : ''}
            ${done ? 'bg-transparent border-white/[0.03]' : 'bg-white/[0.02] border-white/[0.06]'}`}
        >
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            className="mt-0.5 shrink-0 text-slate-700 hover:text-slate-400
              cursor-grab active:cursor-grabbing transition-colors
              opacity-0 group-hover:opacity-100 touch-none"
          >
            <GripVertical size={16} />
          </div>

          {/* Checkbox */}
          <button
            onClick={handleToggle}
            className={`mt-0.5 shrink-0 transition-colors ${
              done ? 'text-emerald-400' : 'text-slate-600 hover:text-violet-400'
            }`}
          >
            {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-snug transition-all ${
              done ? 'line-through text-slate-600' : 'text-slate-200'
            }`}>
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
                  style={{ color: tag.color, borderColor: tag.color+'40', backgroundColor: tag.color+'15' }}>
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0">
            <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
            <div onClick={e => e.stopPropagation()}>
              <Dropdown align="right"
                trigger={
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                    text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                    <MoreHorizontal size={15} />
                  </button>
                }
                items={menuItems}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete task?" description="This will permanently delete the task and all its subtasks."
        confirmLabel="Delete"
      />
    </>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }) {
  const colors = {
    slate:   'text-slate-400 bg-slate-500/10 border-slate-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red:     'text-red-400 bg-red-500/10 border-red-500/20',
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${colors[color]}`}>
      <Icon size={14} />
      <span className="font-semibold">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  )
}

// ── Sort dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'manual',       label: '↕️ Manual (drag to reorder)' },
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc',  label: 'Oldest first' },
  { value: 'due_asc',      label: 'Due date (earliest)' },
  { value: 'priority',     label: 'Priority' },
]
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }

function sortTasks(tasks, sortBy) {
  if (sortBy === 'manual') return tasks // already ordered by sort_order
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'created_asc':  return new Date(a.created_at) - new Date(b.created_at)
      case 'created_desc': return new Date(b.created_at) - new Date(a.created_at)
      case 'due_asc':
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1; if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      case 'priority':
        return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
      default: return 0
    }
  })
}

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = SORT_OPTIONS.find(o => o.value === value)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03]
          border border-white/[0.08] text-sm text-slate-300 hover:bg-white/[0.06] transition-all"
      >
        <SortAsc size={14} className="text-slate-500" />
        <span className="hidden sm:inline">{current?.label}</span>
        <span className="sm:hidden">Sort</span>
        <ChevronDown size={13} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-52 bg-[#16162a] border
              border-white/10 rounded-xl shadow-2xl z-20 p-1"
          >
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  value === opt.value ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >{opt.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const STATUS_TABS = [
  { value: 'all',         label: 'All' },
  { value: 'todo',        label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const toast      = useToast()
  const user       = useAuthStore(s => s.user)
  const tasks      = useTaskStore(s => s.tasks)
  const loading    = useTaskStore(s => s.loading)
  const fetchTasks = useTaskStore(s => s.fetchTasks)
  const setTasks   = useTaskStore(s => s.setTasks)

  const [showAdd,     setShowAdd]     = useState(false)
  const [sortBy,      setSortBy]      = useState('manual')
  const [activeTab,   setActiveTab]   = useState('all')
  const [workspaceId, setWorkspaceId] = useState(null)
  const [openTaskId,  setOpenTaskId]  = useState(null)
  const [activeId,    setActiveId]    = useState(null) // dnd active item

  // dnd sensors — supports mouse, touch, keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!user) return
    fetchTasks(user.id)
    loadWorkspace()
  }, [user])

  const loadWorkspace = async () => {
    const { data } = await supabase.from('workspaces').select('id')
      .eq('owner_id', user.id).eq('is_personal', true).maybeSingle()
    if (data) { setWorkspaceId(data.id); return }
    const { data: ws } = await supabase.from('workspaces')
      .insert({ name: 'Personal', owner_id: user.id, is_personal: true, icon: '🏠' })
      .select('id').single()
    if (ws) {
      setWorkspaceId(ws.id)
      await supabase.from('workspace_members').insert({ workspace_id: ws.id, user_id: user.id, role: 'owner' })
    }
  }

  const stats = useMemo(() => ({
    total:   tasks.length,
    done:    tasks.filter(t => t.status === 'done').length,
    pending: tasks.filter(t => t.status === 'todo').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  }), [tasks])

  const visibleTasks = useMemo(() => {
    const filtered = activeTab === 'all' ? tasks : tasks.filter(t => t.status === activeTab)
    return sortTasks(filtered, sortBy)
  }, [tasks, activeTab, sortBy])

  // ── Drag handlers ────────────────────────────────────────────────────────
  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    if (sortBy !== 'manual') return // only reorder in manual mode

    const oldIndex = visibleTasks.findIndex(t => t.id === active.id)
    const newIndex = visibleTasks.findIndex(t => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(visibleTasks, oldIndex, newIndex)

    // Optimistic update — rebuild tasks array preserving non-visible tasks
    const visibleIds = new Set(visibleTasks.map(t => t.id))
    const otherTasks = tasks.filter(t => !visibleIds.has(t.id))
    setTasks([...reordered, ...otherTasks])

    // Persist sort_order to Supabase
    const updates = reordered.map((task, i) => ({
      id: task.id,
      sort_order: i,
    }))

    // Batch update using Promise.all
    await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from('tasks').update({ sort_order }).eq('id', id)
      )
    )
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  return (
    <DashboardLayout>
      <div className={`transition-all duration-300 ${openTaskId ? 'lg:mr-[420px]' : ''}`}>
        <div className="px-4 md:px-8 py-5 md:py-7 max-w-[900px] mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between mb-6"
          >
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-white">My Tasks</h1>
              <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600
                hover:bg-violet-500 text-white text-sm font-medium shadow-lg
                shadow-violet-900/40 transition-all active:scale-95"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">Add</span>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }} className="flex flex-wrap gap-2 mb-6"
          >
            <StatPill icon={Circle}       label="total"   value={stats.total}   color="slate" />
            <StatPill icon={CheckCircle2} label="done"    value={stats.done}    color="emerald" />
            <StatPill icon={Clock}        label="pending" value={stats.pending} color="amber" />
            {stats.overdue > 0 && <StatPill icon={AlertCircle} label="overdue" value={stats.overdue} color="red" />}
          </motion.div>

          {/* Toolbar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex items-center justify-between mb-5 gap-3"
          >
            <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] overflow-x-auto">
              {STATUS_TABS.map(tab => (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className={`px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium
                    transition-all duration-150 whitespace-nowrap ${
                    activeTab === tab.value ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {tab.value !== 'all' && (
                    <span className="ml-1 text-xs opacity-60">
                      {tasks.filter(t => t.status === tab.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </motion.div>

          {/* Drag hint */}
          {sortBy === 'manual' && visibleTasks.length > 1 && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-slate-600 mb-3 flex items-center gap-1.5"
            >
              <GripVertical size={12} />
              Drag tasks to reorder
            </motion.p>
          )}

          {/* Task list with DnD */}
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => <TaskSkeleton key={i} />)}
            </div>
          ) : visibleTasks.length === 0 ? (
            <EmptyState
              icon="✅"
              title={activeTab === 'all' ? 'No tasks yet' : `No ${activeTab.replace('_', ' ')} tasks`}
              description="Create your first task to get started"
              action={{ label: '+ New task', onClick: () => setShowAdd(true) }}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={visibleTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {visibleTasks.map((task, i) => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      onOpen={setOpenTaskId}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag overlay — floats above everything while dragging */}
              <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                {activeTask && (
                  <SortableTaskCard
                    task={activeTask}
                    index={0}
                    onOpen={() => {}}
                    isDragging
                  />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Side panel */}
      <TaskDetailPanel taskId={openTaskId} onClose={() => setOpenTaskId(null)} />

      <AddTaskModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => fetchTasks(user.id)}
        workspaceId={workspaceId}
      />
    </DashboardLayout>
  )
}