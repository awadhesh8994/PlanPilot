import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Trash2, Flag, Calendar, Tag, AlignLeft,
  ChevronDown, CheckSquare
} from 'lucide-react'
import { Button, Input, Textarea, Select, useToast } from '../ui'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/useAuthStore'
import useTaskStore from '../../store/useTaskStore'

const PRIORITIES = [
  { value: 'low',    label: '🟢 Low' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'high',   label: '🔴 High' },
  { value: 'urgent', label: '🚨 Urgent' },
]

const priorityColors = {
  low:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high:   'text-red-400 bg-red-500/10 border-red-500/20',
  urgent: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
}

function SubtaskInput({ subtasks, onChange }) {
  const add = () => onChange([...subtasks, { id: Date.now(), title: '' }])
  const remove = (id) => onChange(subtasks.filter(s => s.id !== id))
  const update = (id, title) =>
    onChange(subtasks.map(s => s.id === id ? { ...s, title } : s))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <CheckSquare size={14} className="text-slate-500" />
          Subtasks
        </label>
        <button
          type="button"
          onClick={add}
          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <AnimatePresence>
        {subtasks.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0 ml-1" />
            <input
              type="text"
              value={s.title}
              onChange={e => update(s.id, e.target.value)}
              placeholder={`Subtask ${i + 1}`}
              autoFocus
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
                text-sm text-white placeholder:text-slate-600 outline-none
                focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => remove(s.id)}
              className="text-slate-600 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function TagSelector({ selected, onChange, workspaceId }) {
  const [tags, setTags] = useState([])
  const [creating, setCreating] = useState(false)
  const [newTag, setNewTag] = useState('')
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    if (!workspaceId) return
    supabase.from('tags')
      .select('*')
      .eq('workspace_id', workspaceId)
      .then(({ data }) => setTags(data || []))
  }, [workspaceId])

  const toggle = (tagId) => {
    onChange(
      selected.includes(tagId)
        ? selected.filter(id => id !== tagId)
        : [...selected, tagId]
    )
  }

  const createTag = async () => {
    if (!newTag.trim()) return
    const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899']
    const color  = colors[Math.floor(Math.random() * colors.length)]
    const { data, error } = await supabase.from('tags')
      .insert({ name: newTag.trim(), color, workspace_id: workspaceId, created_by: user.id })
      .select().single()
    if (!error && data) {
      setTags(prev => [...prev, data])
      onChange([...selected, data.id])
    }
    setNewTag('')
    setCreating(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <Tag size={14} className="text-slate-500" />
        Tags
      </label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              selected.includes(tag.id)
                ? 'opacity-100 scale-105'
                : 'opacity-50 hover:opacity-80'
            }`}
            style={{
              borderColor: tag.color + '40',
              backgroundColor: tag.color + '20',
              color: tag.color,
            }}
          >
            {selected.includes(tag.id) && '✓ '}{tag.name}
          </button>
        ))}

        {creating ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createTag() } if (e.key === 'Escape') setCreating(false) }}
              placeholder="Tag name..."
              className="bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-xs
                text-white outline-none focus:border-violet-500/50 w-24"
            />
            <button type="button" onClick={createTag} className="text-xs text-violet-400 hover:text-violet-300">✓</button>
            <button type="button" onClick={() => setCreating(false)} className="text-xs text-slate-600 hover:text-slate-400">✕</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="px-2.5 py-1 rounded-full text-xs text-slate-600 border border-white/5
              hover:text-slate-400 hover:border-white/10 transition-all flex items-center gap-1"
          >
            <Plus size={10} /> New tag
          </button>
        )}
      </div>
    </div>
  )
}

export default function AddTaskModal({ open, onClose, onSuccess, workspaceId }) {
  const toast      = useToast()
  const user       = useAuthStore(s => s.user)
  const addTask    = useTaskStore(s => s.addTask)

  const [title,     setTitle]     = useState('')
  const [desc,      setDesc]      = useState('')
  const [priority,  setPriority]  = useState('medium')
  const [dueDate,   setDueDate]   = useState('')
  const [tagIds,    setTagIds]    = useState([])
  const [subtasks,  setSubtasks]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle(''); setDesc(''); setPriority('medium')
      setDueDate(''); setTagIds([]); setSubtasks([]); setError('')
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Task title is required'); return }

    setLoading(true)
    setError('')

    const { error: err } = await addTask({
      title: title.trim(),
      description: desc.trim() || null,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status: 'todo',
      created_by: user.id,
      workspace_id: workspaceId,
      tagIds,
      subtasks,
    })

    setLoading(false)

    if (err) {
      toast(err.message || 'Failed to create task', 'error')
    } else {
      toast('Task created! 🎉', 'success')
      onSuccess?.()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-lg mx-4 md:mx-0 bg-[#111120] border border-white/10
              rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <h2 className="text-base font-semibold text-white">New Task</h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 flex flex-col gap-5 max-h-[80vh] md:max-h-[70vh] overflow-y-auto">

                {/* Title */}
                <div>
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setError('') }}
                    placeholder="Task title..."
                    className="w-full bg-transparent text-lg font-medium text-white
                      placeholder:text-slate-600 outline-none border-b border-white/[0.07]
                      pb-3 focus:border-violet-500/50 transition-colors"
                  />
                  {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <AlignLeft size={14} className="text-slate-500" />
                    Description
                  </label>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Add details..."
                    rows={2}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl
                      px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none
                      resize-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                      transition-all"
                  />
                </div>

                {/* Priority + Due date row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Priority */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Flag size={14} className="text-slate-500" />
                      Priority
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRIORITIES.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            priority === p.value
                              ? priorityColors[p.value]
                              : 'text-slate-500 bg-white/[0.03] border-white/[0.07] hover:border-white/20'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-500" />
                      Due date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl
                        px-3 py-2 text-sm text-slate-300 outline-none
                        focus:border-violet-500/50 transition-all
                        [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Tags */}
                {workspaceId && (
                  <TagSelector
                    selected={tagIds}
                    onChange={setTagIds}
                    workspaceId={workspaceId}
                  />
                )}

                {/* Subtasks */}
                <SubtaskInput subtasks={subtasks} onChange={setSubtasks} />

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={onClose} size="sm">
                  Cancel
                </Button>
                <Button type="submit" loading={loading} size="sm">
                  Create task
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}