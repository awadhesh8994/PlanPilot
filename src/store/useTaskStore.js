import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),

  fetchTasks: async (userId) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, task_tags(tag_id, tags(id, name, color))`)
        .eq('created_by', userId)
        .is('parent_id', null)
        .order('sort_order', { ascending: true })

      if (error) throw error
      set({ tasks: data || [] })
    } catch (e) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchSubtasks: async (parentId) => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
    return data || []
  },

  addTask: async (taskData) => {
    const { tagIds, subtasks, ...rest } = taskData
    try {
      // Insert main task
      const { data, error } = await supabase
        .from('tasks')
        .insert(rest)
        .select()
        .single()
      if (error) throw error

      // Insert tags
      if (tagIds?.length) {
        await supabase.from('task_tags').insert(
          tagIds.map(tag_id => ({ task_id: data.id, tag_id }))
        )
      }

      // Insert subtasks
      if (subtasks?.length) {
        const subs = subtasks
          .filter(s => s.title.trim())
          .map(s => ({
            title: s.title,
            created_by: rest.created_by,
            workspace_id: rest.workspace_id,
            parent_id: data.id,
            status: 'todo',
          }))
        if (subs.length) await supabase.from('tasks').insert(subs)
      }

      // Refresh tasks
      await get().fetchTasks(rest.created_by)
      return { data, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  },

  updateTask: async (id, updates, userId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      await get().fetchTasks(userId)
      return { error: null }
    } catch (e) {
      return { error: e }
    }
  },

  deleteTask: async (id, userId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      if (error) throw error
      set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
      return { error: null }
    } catch (e) {
      return { error: e }
    }
  },

  toggleTask: async (task, userId) => {
    const newStatus   = task.status === 'done' ? 'todo' : 'done'
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null

    // Optimistic
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === task.id ? { ...t, status: newStatus, completed_at: completedAt } : t
      )
    }))

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: completedAt })
      .eq('id', task.id)

    if (error) {
      // Revert
      set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? task : t) }))
      return { error }
    }
    return { error: null }
  },
}))

export default useTaskStore