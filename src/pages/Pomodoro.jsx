import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Flame, Target, Check, Trash2,
  MoreHorizontal, Calendar, TrendingUp, X
} from 'lucide-react'
import { format, eachDayOfInterval, subDays, isToday } from 'date-fns'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'
import DashboardLayout from '../components/DashboardLayout'
import {
  EmptyState, ConfirmDialog, useToast, Dropdown, Modal, Button, Input
} from '../components/ui'

const ICONS = ['⭐','🔥','💪','📚','🧘','🏃','💧','🥗','😴','🎯','✍️','🎵','🧠','❤️','🌱']
const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Add Habit Modal ───────────────────────────────────────────────────────────
function AddHabitModal({ open, onClose, onSuccess }) {
  const toast = useToast()
  const user  = useAuthStore(s => s.user)

  const [name,       setName]       = useState('')
  const [icon,       setIcon]       = useState('⭐')
  const [color,      setColor]      = useState('#6366f1')
  const [targetDays, setTargetDays] = useState([1,2,3,4,5])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (open) { setName(''); setIcon('⭐'); setColor('#6366f1'); setTargetDays([1,2,3,4,5]); setError('') }
  }, [open])

  const toggleDay = (d) =>
    setTargetDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Habit name is required'); return }
    setLoading(true)
    const { error: err } = await supabase.from('habits').insert({
      name: name.trim(), icon, color,
      user_id: user.id,
      frequency: 'custom',
      target_days: targetDays,
    })
    setLoading(false)
    if (err) { toast(err.message, 'error') }
    else { toast('Habit created! 🎯', 'success'); onSuccess(); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Habit" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <input
            autoFocus
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Habit name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-white placeholder:text-slate-600 outline-none
              focus:border-violet-500/50 transition-all"
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        {/* Icon picker */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Icon</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button
                key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center
                  transition-all border ${icon === ic
                    ? 'bg-violet-600/30 border-violet-500/50 scale-110'
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Color</p>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c ? 'scale-125 ring-2 ring-white/30 ring-offset-2 ring-offset-[#111120]' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Days of week */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Repeat on</p>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={d} type="button" onClick={() => toggleDay(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  targetDays.includes(i)
                    ? 'text-white border-transparent'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300'
                }`}
                style={targetDays.includes(i) ? { backgroundColor: color + 'cc', borderColor: color } : {}}
              >
                {d[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Habit heat strip (last 14 days) ──────────────────────────────────────────
function HeatStrip({ habitId, logs }) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() })
  return (
    <div className="flex gap-1 mt-3">
      {days.map(day => {
        const key    = format(day, 'yyyy-MM-dd')
        const filled = logs.has(key)
        return (
          <div
            key={key}
            title={format(day, 'MMM d')}
            className={`flex-1 h-2 rounded-sm transition-all ${
              filled ? 'opacity-100' : isToday(day) ? 'opacity-20' : 'opacity-10'
            }`}
            style={{ backgroundColor: filled ? undefined : '#ffffff20' }}
          >
            {filled && <div className="w-full h-full rounded-sm bg-current" />}
          </div>
        )
      })}
    </div>
  )
}

// ── Habit card ────────────────────────────────────────────────────────────────
function HabitCard({ habit, logs, checked, onCheck, onDelete, index }) {
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const toast = useToast()

  const completedThisWeek = [...Array(7)].filter((_, i) => {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    return logs.has(d)
  }).length

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('habits').delete().eq('id', habit.id)
    setDeleting(false)
    toast('Habit deleted', 'success')
    onDelete(habit.id)
    setShowDelete(false)
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5
          hover:border-white/[0.12] transition-all group"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Check button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onCheck(habit.id)}
              className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center
                text-xl transition-all duration-200 shrink-0 ${
                checked
                  ? 'border-transparent shadow-lg'
                  : 'border-white/10 hover:border-white/25 bg-white/[0.02]'
              }`}
              style={checked ? { backgroundColor: habit.color, boxShadow: `0 4px 15px ${habit.color}50` } : {}}
            >
              {checked
                ? <Check size={18} className="text-white" />
                : <span className="text-lg">{habit.icon}</span>
              }
            </motion.button>

            <div>
              <p className="text-sm font-medium text-white">{habit.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Flame size={11} className="text-amber-400" />
                <span className="text-xs text-slate-500">{habit.streak || 0} day streak</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">{completedThisWeek}/7 this week</span>
              </div>
            </div>
          </div>

          <Dropdown
            align="right"
            trigger={
              <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                <MoreHorizontal size={15} />
              </button>
            }
            items={[
              { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setShowDelete(true) }
            ]}
          />
        </div>

        {/* Heat strip */}
        <div style={{ color: habit.color }}>
          <HeatStrip habitId={habit.id} logs={logs} />
        </div>

        {/* Days */}
        <div className="flex gap-1 mt-2">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={`flex-1 text-center text-[9px] font-medium transition-colors ${
                habit.target_days?.includes(i) ? 'text-slate-400' : 'text-slate-700'
              }`}
            >
              {d[0]}
            </div>
          ))}
        </div>
      </motion.div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete habit?"
        description="This will delete the habit and all its history permanently."
        confirmLabel="Delete"
      />
    </>
  )
}

// ── Summary stats ─────────────────────────────────────────────────────────────
function HabitStats({ habits, checkedIds, allLogs }) {
  const todayTotal     = habits.length
  const todayCompleted = checkedIds.length
  const bestStreak     = habits.reduce((max, h) => Math.max(max, h.best_streak || 0), 0)
  const totalLogs      = Object.values(allLogs).reduce((sum, s) => sum + s.size, 0)

  const items = [
    { label: "Today's progress", value: `${todayCompleted}/${todayTotal}`, icon: Target,     color: 'text-violet-400' },
    { label: 'Best streak',      value: `${bestStreak}d`,                  icon: Flame,      color: 'text-amber-400' },
    { label: 'Total check-ins',  value: totalLogs,                         icon: TrendingUp, color: 'text-emerald-400' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {items.map(item => (
        <div key={item.label}
          className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3"
        >
          <item.icon size={18} className={item.color} />
          <div>
            <p className="text-lg font-bold text-white font-display">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const toast = useToast()
  const user  = useAuthStore(s => s.user)

  const [habits,      setHabits]      = useState([])
  const [allLogs,     setAllLogs]     = useState({})   // { habitId: Set<dateStr> }
  const [checkedIds,  setCheckedIds]  = useState([])
  const [showAdd,     setShowAdd]     = useState(false)
  const [loading,     setLoading]     = useState(true)

  const loadData = async () => {
    setLoading(true)
    // Fetch habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    setHabits(habitsData || [])

    // Fetch logs for last 14 days
    const since = format(subDays(new Date(), 13), 'yyyy-MM-dd')
    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', since)

    // Build map: habitId → Set of date strings
    const map = {}
    ;(logsData || []).forEach(log => {
      if (!map[log.habit_id]) map[log.habit_id] = new Set()
      map[log.habit_id].add(log.logged_date)
    })
    setAllLogs(map)

    // Today's checked habits
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayChecked = (logsData || [])
      .filter(l => l.logged_date === today)
      .map(l => l.habit_id)
    setCheckedIds(todayChecked)

    setLoading(false)
  }

  useEffect(() => { if (user) loadData() }, [user])

  const handleCheck = async (habitId) => {
    const today     = format(new Date(), 'yyyy-MM-dd')
    const isChecked = checkedIds.includes(habitId)

    if (isChecked) {
      setCheckedIds(prev => prev.filter(id => id !== habitId))
      setAllLogs(prev => {
        const updated = new Set(prev[habitId])
        updated.delete(today)
        return { ...prev, [habitId]: updated }
      })
      await supabase.from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('logged_date', today)
    } else {
      setCheckedIds(prev => [...prev, habitId])
      setAllLogs(prev => {
        const updated = new Set(prev[habitId] || [])
        updated.add(today)
        return { ...prev, [habitId]: updated }
      })
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habitId, user_id: user.id, logged_date: today
      })
      if (error) {
        toast('Failed to log habit', 'error')
        setCheckedIds(prev => prev.filter(id => id !== habitId))
      }
    }
  }

  const handleDelete = (habitId) => {
    setHabits(prev => prev.filter(h => h.id !== habitId))
    setCheckedIds(prev => prev.filter(id => id !== habitId))
  }

  const todayDayOfWeek = new Date().getDay()
  const todayHabits    = habits.filter(h => h.target_days?.includes(todayDayOfWeek))
  const otherHabits    = habits.filter(h => !h.target_days?.includes(todayDayOfWeek))

  return (
    <DashboardLayout>
      <div className="px-8 py-7 max-w-[900px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Habits</h1>
            <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600
              hover:bg-violet-500 text-white text-sm font-medium shadow-lg
              shadow-violet-900/40 transition-all"
          >
            <Plus size={16} /> New habit
          </button>
        </motion.div>

        {/* Stats */}
        {habits.length > 0 && (
          <HabitStats habits={habits} checkedIds={checkedIds} allLogs={allLogs} />
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No habits yet"
            description="Build positive habits by tracking them daily. Start with one small habit!"
            action={{ label: '+ New habit', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <>
            {/* Today's habits */}
            {todayHabits.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Today · {checkedIds.filter(id => todayHabits.find(h => h.id === id)).length}/{todayHabits.length} done
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {todayHabits.map((habit, i) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        logs={allLogs[habit.id] || new Set()}
                        checked={checkedIds.includes(habit.id)}
                        onCheck={handleCheck}
                        onDelete={handleDelete}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Other habits */}
            {otherHabits.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">
                  Not scheduled today
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otherHabits.map((habit, i) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      logs={allLogs[habit.id] || new Set()}
                      checked={checkedIds.includes(habit.id)}
                      onCheck={handleCheck}
                      onDelete={handleDelete}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddHabitModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={loadData}
      />
    </DashboardLayout>
  )
}