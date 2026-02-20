import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId) => {
    set({ loading: true })
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    const notifs = data || []
    set({
      notifications: notifs,
      unreadCount: notifs.filter(n => !n.is_read).length,
      loading: false,
    })
  },

  markAsRead: async (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  },

  markAllAsRead: async (userId) => {
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  },

  clearAll: async (userId) => {
    set({ notifications: [], unreadCount: 0 })
    await supabase.from('notifications').delete().eq('user_id', userId)
  },

  addNotification: async ({ userId, type, title, body, link }) => {
    const { data } = await supabase
      .from('notifications')
      .insert({ user_id: userId, type, title, body, link })
      .select()
      .single()

    if (data) {
      set(s => ({
        notifications: [data, ...s.notifications],
        unreadCount: s.unreadCount + 1,
      }))
    }
    return data
  },

  // Subscribe to realtime notifications
  subscribeRealtime: (userId) => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const notif = payload.new
        set(s => ({
          notifications: [notif, ...s.notifications],
          unreadCount: s.unreadCount + 1,
        }))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  },

  // Check for due tasks and create notifications
  checkDueTaskReminders: async (userId) => {
    const now       = new Date()
    const in24hrs   = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const today     = now.toISOString()

    const { data: dueTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('created_by', userId)
      .neq('status', 'done')
      .lte('due_date', in24hrs.toISOString())
      .gte('due_date', today)

    if (!dueTasks?.length) return

    // Check which ones we haven't notified about yet
    const { data: existing } = await supabase
      .from('notifications')
      .select('link')
      .eq('user_id', userId)
      .eq('type', 'reminder')
      .gte('created_at', new Date(now.setHours(0,0,0,0)).toISOString())

    const notifiedLinks = new Set((existing || []).map(n => n.link))

    for (const task of dueTasks) {
      const link = `/tasks?highlight=${task.id}`
      if (notifiedLinks.has(link)) continue

      const dueDate  = new Date(task.due_date)
      const isToday  = dueDate.toDateString() === new Date().toDateString()
      const isPast   = dueDate < new Date()

      await get().addNotification({
        userId,
        type: 'reminder',
        title: isPast ? '⚠️ Task overdue' : '📅 Task due soon',
        body: `"${task.title}" is ${isPast ? 'overdue' : isToday ? 'due today' : 'due tomorrow'}`,
        link,
      })
    }
  },

  // Check habit streaks
  checkHabitStreaks: async (userId) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, streak, target_days')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('streak', 1) // only habits with existing streak

    if (!habits?.length) return

    const { data: yesterdayLogs } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('logged_date', yesterdayStr)

    const checkedYesterday = new Set((yesterdayLogs || []).map(l => l.habit_id))

    for (const habit of habits) {
      const dayOfWeek = yesterday.getDay()
      const wasScheduled = habit.target_days?.includes(dayOfWeek)
      if (!wasScheduled) continue
      if (checkedYesterday.has(habit.id)) continue

      // Streak broken — check we haven't already notified today
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'reminder')
        .like('link', `/habits?highlight=${habit.id}`)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .single()

      if (existing) continue

      await get().addNotification({
        userId,
        type: 'reminder',
        title: '🔥 Streak broken',
        body: `You missed "${habit.name}" yesterday. Start a new streak today!`,
        link: `/habits?highlight=${habit.id}`,
      })
    }
  },
}))

export default useNotificationStore