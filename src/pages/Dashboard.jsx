import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'
import DashboardLayout from '../components/DashboardLayout'
import StatsWidget       from '../components/widgets/StatsWidget'
import TodayTasksWidget  from '../components/widgets/TodayTasksWidget'
import PomodoroWidget    from '../components/widgets/PomodoroWidget'
import UpcomingWidget    from '../components/widgets/UpcomingWidget'
import HabitWidget       from '../components/widgets/HabitWidget'
import { TaskSkeleton, useToast } from '../components/ui'

// ─── data fetching helpers ───────────────────────────────────────────────────

async function fetchTodayTasks(userId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('created_by', userId)
    .is('parent_id', null)
    .or(`due_date.gte.${today.toISOString()},due_date.is.null`)
    .lt('due_date', tomorrow.toISOString())
    .order('sort_order', { ascending: true })

  // Also get tasks with no due date created today
  const { data: todayCreated } = await supabase
    .from('tasks')
    .select('*')
    .eq('created_by', userId)
    .is('parent_id', null)
    .is('due_date', null)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('sort_order', { ascending: true })

  const combined = [
    ...(data || []),
    ...(todayCreated || []).filter(t => !(data || []).find(d => d.id === t.id)),
  ]
  return combined
}

async function fetchUpcomingTasks(userId) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('created_by', userId)
    .is('parent_id', null)
    .neq('status', 'done')
    .neq('status', 'cancelled')
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })
    .limit(10)

  return data || []
}

async function fetchStats(userId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [{ count: completedToday }, { count: pending }, { count: totalCompleted }] =
    await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('created_by', userId).eq('status', 'done')
        .gte('completed_at', today.toISOString())
        .lt('completed_at', tomorrow.toISOString()),
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('created_by', userId).eq('status', 'todo').is('parent_id', null),
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('created_by', userId).eq('status', 'done'),
    ])

  return {
    completedToday: completedToday || 0,
    pending: pending || 0,
    totalCompleted: totalCompleted || 0,
    streak: 0, // habit streak — extend later
  }
}

async function fetchHabits(userId) {
  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  return data || []
}

async function fetchCheckedHabits(userId) {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('habit_logs')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('logged_date', today)
  return (data || []).map(l => l.habit_id)
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const toast   = useToast()
  const user    = useAuthStore(s => s.user)
  const profile = useAuthStore(s => s.profile)

  const [todayTasks,  setTodayTasks]  = useState([])
  const [upcoming,    setUpcoming]    = useState([])
  const [stats,       setStats]       = useState(null)
  const [habits,      setHabits]      = useState([])
  const [checkedHabits, setCheckedHabits] = useState([])
  const [loading,     setLoading]     = useState(true)

  // ── load all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    async function loadAll() {
      setLoading(true)
      try {
        const [t, u, s, h, ch] = await Promise.all([
          fetchTodayTasks(user.id),
          fetchUpcomingTasks(user.id),
          fetchStats(user.id),
          fetchHabits(user.id),
          fetchCheckedHabits(user.id),
        ])
        setTodayTasks(t)
        setUpcoming(u)
        setStats(s)
        setHabits(h)
        setCheckedHabits(ch)
      } catch (e) {
        toast('Failed to load dashboard data', 'error')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [user])

  // ── toggle task completion ─────────────────────────────────────────────────
  const handleToggleTask = async (task) => {
    const newStatus    = task.status === 'done' ? 'todo' : 'done'
    const completedAt  = newStatus === 'done' ? new Date().toISOString() : null

    // Optimistic update
    setTodayTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t)
    )

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: completedAt })
      .eq('id', task.id)

    if (error) {
      toast('Failed to update task', 'error')
      // Revert
      setTodayTasks(prev =>
        prev.map(t => t.id === task.id ? task : t)
      )
    } else {
      // Refresh stats
      fetchStats(user.id).then(setStats)
    }
  }

  // ── toggle habit check ─────────────────────────────────────────────────────
  const handleToggleHabit = async (habitId) => {
    const today = new Date().toISOString().split('T')[0]
    const isChecked = checkedHabits.includes(habitId)

    if (isChecked) {
      setCheckedHabits(prev => prev.filter(id => id !== habitId))
      await supabase.from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('logged_date', today)
    } else {
      setCheckedHabits(prev => [...prev, habitId])
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: user.id,
        logged_date: today,
      })
      if (error) {
        toast('Failed to log habit', 'error')
        setCheckedHabits(prev => prev.filter(id => id !== habitId))
      }
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <DashboardLayout>
      <div className="px-4 md:px-8 py-5 md:py-7 max-w-[1200px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl font-bold text-white">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d')} · Here's your day at a glance
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="mb-6">
          <StatsWidget stats={stats} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left col — tasks + upcoming */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {loading ? (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
                {[...Array(4)].map((_, i) => <TaskSkeleton key={i} />)}
              </div>
            ) : (
              <TodayTasksWidget
                tasks={todayTasks}
                onToggle={handleToggleTask}
                onAdd={() => {/* open add task modal — wire up next */}}
              />
            )}

            <UpcomingWidget tasks={upcoming} />
          </div>

          {/* Right col — pomodoro + habits */}
          <div className="flex flex-col gap-5">
            <PomodoroWidget />
            <HabitWidget
              habits={habits}
              checkedIds={checkedHabits}
              onCheck={handleToggleHabit}
              onAdd={() => {/* open add habit modal — wire up next */}}
            />
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}