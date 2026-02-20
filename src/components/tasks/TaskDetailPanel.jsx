import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Circle, CheckCircle2, Flag, Calendar, Tag,
  AlignLeft, MessageSquare, Send, Trash2, Clock,
  ChevronDown, ChevronRight, Plus, Edit3, Check
} from 'lucide-react'
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/useAuthStore'
import useTaskStore from '../../store/useTaskStore'
import { Avatar, Badge, priorityColor, ConfirmDialog, useToast } from '../ui'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']
const PRIORITY_COLORS = {
  low:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  medium: 'text-amber-400   bg-amber-500/10   border-amber-500/25',
  high:   'text-red-400     bg-red-500/10     border-red-500/25',
  urgent: 'text-pink-400    bg-pink-500/10    border-pink-500/25',
}

// ── Comment item ──────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUserId, onDelete }) {
  const [showDelete, setShowDelete] = useState(false)
  const isMine = comment.user_id === currentUserId

  return (
    <div className="flex items-start gap-3 group">
      <Avatar name={comment.profiles?.full_name || 'User'} src={comment.profiles?.avatar_url} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-white">{comment.profiles?.full_name || 'User'}</span>
          <span className="text-[10px] text-slate-600">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-slate-300 mt-1 leading-relaxed">{comment.content}</p>
      </div>
      {isMine && (
        <button
          onClick={() => onDelete(comment.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600
            hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

// ── Subtask row ───────────────────────────────────────────────────────────────
function SubtaskRow({ subtask, onToggle, onDelete }) {
  const done = subtask.status === 'done'
  return (
    <div className="flex items-center gap-2.5 py-1.5 group">
      <button
        onClick={() => onToggle(subtask)}
        className={`shrink-0 transition-colors ${done ? 'text-emerald-400' : 'text-slate-600 hover:text-violet-400'}`}
      >
        {done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      </button>
      <span className={`flex-1 text-sm transition-all ${done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
        {subtask.title}
      </span>
      <button
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-600
          hover:text-red-400 transition-all"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ── Editable field ────────────────────────────────────────────────────────────
function EditableText({ value, onSave, placeholder, multiline = false, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value || '')
  const ref = useRef(null)

  useEffect(() => { setVal(value || '') }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  const handleSave = () => {
    setEditing(false)
    if (val !== value) onSave(val)
  }

  if (editing) {
    const props = {
      ref,
      value: val,
      onChange: e => setVal(e.target.value),
      onBlur: handleSave,
      onKeyDown: e => {
        if (!multiline && e.key === 'Enter') { e.preventDefault(); handleSave() }
        if (e.key === 'Escape') { setEditing(false); setVal(value || '') }
      },
      className: `w-full bg-white/5 border border-violet-500/40 rounded-lg px-3 py-1.5
        text-sm text-white outline-none resize-none ${className}`,
    }
    return multiline
      ? <textarea {...props} rows={3} />
      : <input {...props} type="text" />
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-text group flex items-start gap-2 ${className}`}
    >
      <span className={`flex-1 text-sm leading-relaxed ${value ? 'text-slate-200' : 'text-slate-600 italic'}`}>
        {value || placeholder}
      </span>
      <Edit3 size={12} className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5" />
    </div>
  )
}

// ── Main side panel ───────────────────────────────────────────────────────────
export default function TaskDetailPanel({ taskId, onClose }) {
  const toast       = useToast()
  const user        = useAuthStore(s => s.user)
  const updateTask  = useTaskStore(s => s.updateTask)
  const toggleTask  = useTaskStore(s => s.toggleTask)

  const [task,       setTask]       = useState(null)
  const [subtasks,   setSubtasks]   = useState([])
  const [comments,   setComments]   = useState([])
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [addingSub,  setAddingSub]  = useState(false)
  const [sending,    setSending]    = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [showDeleteTask, setShowDeleteTask] = useState(false)
  const deleteTask  = useTaskStore(s => s.deleteTask)
  const commentEndRef = useRef(null)

  // Load task + subtasks + comments
  useEffect(() => {
    if (!taskId) return
    setLoading(true)

    Promise.all([
      supabase.from('tasks').select('*, task_tags(tag_id, tags(id,name,color))').eq('id', taskId).single(),
      supabase.from('tasks').select('*').eq('parent_id', taskId).order('created_at'),
      supabase.from('task_comments').select('*, profiles(full_name, avatar_url)').eq('task_id', taskId).order('created_at'),
    ]).then(([{ data: t }, { data: subs }, { data: comms }]) => {
      setTask(t)
      setSubtasks(subs || [])
      setComments(comms || [])
      setLoading(false)
    })
  }, [taskId])

  // Auto-scroll comments
  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  if (!taskId) return null

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFieldSave = async (field, value) => {
    setTask(prev => ({ ...prev, [field]: value }))
    await updateTask(taskId, { [field]: value }, user.id)
  }

  const handleToggleMain = async () => {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    setTask(prev => ({ ...prev, status: newStatus }))
    await toggleTask(task, user.id)
  }

  const handleToggleSubtask = async (sub) => {
    const newStatus = sub.status === 'done' ? 'todo' : 'done'
    setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, status: newStatus } : s))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    }).eq('id', sub.id)
  }

  const handleDeleteSubtask = async (id) => {
    setSubtasks(prev => prev.filter(s => s.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return
    const { data } = await supabase.from('tasks').insert({
      title: newSubtask.trim(),
      parent_id: taskId,
      created_by: user.id,
      workspace_id: task.workspace_id,
      status: 'todo',
    }).select().single()
    if (data) setSubtasks(prev => [...prev, data])
    setNewSubtask('')
    setAddingSub(false)
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSending(true)
    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, user_id: user.id, content: newComment.trim() })
      .select('*, profiles(full_name, avatar_url)')
      .single()
    setSending(false)
    if (error) { toast('Failed to send comment', 'error'); return }
    setComments(prev => [...prev, data])
    setNewComment('')
  }

  const handleDeleteComment = async (id) => {
    setComments(prev => prev.filter(c => c.id !== id))
    await supabase.from('task_comments').delete().eq('id', id)
  }

  const handleDeleteTask = async () => {
    await deleteTask(taskId, user.id)
    onClose()
  }

  const done     = task?.status === 'done'
  const tags     = task?.task_tags?.map(tt => tt.tags).filter(Boolean) || []
  const doneCount = subtasks.filter(s => s.status === 'done').length

  return (
    <AnimatePresence>
      {taskId && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-screen w-full md:max-w-md bg-[#0e0e1c]
              border-l border-white/[0.07] z-40 flex flex-col shadow-2xl"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col gap-3 w-full px-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-white/[0.03] rounded-xl animate-pulse" style={{ width: `${70 + i * 5}%` }} />
                  ))}
                </div>
              </div>
            ) : task ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleMain}
                      className={`transition-colors ${done ? 'text-emerald-400' : 'text-slate-600 hover:text-violet-400'}`}
                    >
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      done ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                           : 'text-slate-400 bg-white/5 border-white/10'
                    }`}>
                      {done ? 'Done' : task.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowDeleteTask(true)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-5 py-5 flex flex-col gap-6">

                    {/* Title */}
                    <EditableText
                      value={task.title}
                      onSave={v => handleFieldSave('title', v)}
                      placeholder="Task title"
                      className="text-lg font-semibold text-white"
                    />

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-3">

                      {/* Priority */}
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                          <Flag size={10} /> Priority
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {PRIORITIES.map(p => (
                            <button
                              key={p}
                              onClick={() => handleFieldSave('priority', p)}
                              className={`px-2 py-0.5 rounded-lg text-xs font-medium border capitalize transition-all ${
                                task.priority === p
                                  ? PRIORITY_COLORS[p]
                                  : 'text-slate-600 bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Due date */}
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={10} /> Due date
                        </p>
                        <input
                          type="date"
                          value={task.due_date ? task.due_date.split('T')[0] : ''}
                          onChange={e => handleFieldSave('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                          className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-1.5
                            text-xs text-slate-300 outline-none focus:border-violet-500/50
                            transition-all [color-scheme:dark] cursor-pointer w-full"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <AlignLeft size={10} /> Notes
                      </p>
                      <EditableText
                        value={task.description}
                        onSave={v => handleFieldSave('description', v)}
                        placeholder="Add notes or description..."
                        multiline
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                          <Tag size={10} /> Tags
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map(tag => (
                            <span key={tag.id}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                              style={{ color: tag.color, borderColor: tag.color + '40', backgroundColor: tag.color + '15' }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subtasks */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                          Subtasks {subtasks.length > 0 && `(${doneCount}/${subtasks.length})`}
                        </p>
                        <button
                          onClick={() => setAddingSub(true)}
                          className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                        >
                          <Plus size={11} /> Add
                        </button>
                      </div>

                      {subtasks.length > 0 && (
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1">
                          {/* Progress */}
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2 mt-2">
                            <motion.div
                              animate={{ width: subtasks.length ? `${(doneCount / subtasks.length) * 100}%` : '0%' }}
                              transition={{ duration: 0.4 }}
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                            />
                          </div>
                          {subtasks.map(sub => (
                            <SubtaskRow
                              key={sub.id} subtask={sub}
                              onToggle={handleToggleSubtask}
                              onDelete={handleDeleteSubtask}
                            />
                          ))}
                        </div>
                      )}

                      <AnimatePresence>
                        {addingSub && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-2"
                          >
                            <input
                              autoFocus
                              value={newSubtask}
                              onChange={e => setNewSubtask(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAddSubtask()
                                if (e.key === 'Escape') { setAddingSub(false); setNewSubtask('') }
                              }}
                              placeholder="Subtask title..."
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
                                text-sm text-white placeholder:text-slate-600 outline-none
                                focus:border-violet-500/50 transition-all"
                            />
                            <button onClick={handleAddSubtask}
                              className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all">
                              <Check size={14} />
                            </button>
                            <button onClick={() => { setAddingSub(false); setNewSubtask('') }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                              <X size={14} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/[0.06]" />

                    {/* Comments */}
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <MessageSquare size={10} /> Comments ({comments.length})
                      </p>

                      {comments.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">No comments yet. Be the first!</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {comments.map(c => (
                            <CommentItem
                              key={c.id} comment={c}
                              currentUserId={user.id}
                              onDelete={handleDeleteComment}
                            />
                          ))}
                          <div ref={commentEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="flex flex-col gap-1 pt-2 border-t border-white/[0.05]">
                      <p className="text-[10px] text-slate-700 flex items-center gap-1">
                        <Clock size={9} />
                        Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </p>
                      {task.completed_at && (
                        <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={9} />
                          Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment input */}
                <div className="px-4 py-3 border-t border-white/[0.07] shrink-0">
                  <div className="flex items-center gap-2">
                    <Avatar name={user?.email} size="xs" />
                    <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08]
                      rounded-xl px-3 py-2 focus-within:border-violet-500/40 transition-all">
                      <input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment() } }}
                        placeholder="Add a comment..."
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                      />
                      <button
                        onClick={handleSendComment}
                        disabled={!newComment.trim() || sending}
                        className="text-slate-600 hover:text-violet-400 disabled:opacity-30
                          transition-colors shrink-0"
                      >
                        <Send size={14} className={sending ? 'animate-pulse' : ''} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}