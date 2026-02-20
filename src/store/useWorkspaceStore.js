import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  members: [],
  loading: false,

  setActiveWorkspace: (id) => {
    set({ activeWorkspaceId: id })
    localStorage.setItem('activeWorkspaceId', id)
  },

  // Replace fetchWorkspaces in useWorkspaceStore.js with this:

fetchWorkspaces: async (userId) => {
  set({ loading: true })
  try {
    const { data: owned } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })

    const { data: memberOf } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces(*)')
      .eq('user_id', userId)

    // Merge — avoid duplicates (owned workspaces already include ones where user is member)
    const ownedIds = new Set((owned || []).map(w => w.id))
    const memberWorkspaces = (memberOf || [])
      .map(m => ({ ...m.workspaces, _role: m.role }))
      .filter(w => w && !ownedIds.has(w.id))  // ← exclude already owned

    const all = [...(owned || []), ...memberWorkspaces]
    set({ workspaces: all })

    const saved   = localStorage.getItem('activeWorkspaceId')
    const valid   = all.find(w => w.id === saved)
    const personal = all.find(w => w.is_personal)
    set({ activeWorkspaceId: valid?.id || personal?.id || all[0]?.id || null })
  } finally {
    set({ loading: false })
  }
},

  createWorkspace: async ({ name, icon, color, userId }) => {
    try {
      const { data: ws, error } = await supabase
        .from('workspaces')
        .insert({ name, icon, color, owner_id: userId, is_personal: false })
        .select()
        .single()
      if (error) throw error

      // Add owner as member
      await supabase.from('workspace_members').insert({
        workspace_id: ws.id, user_id: userId, role: 'owner'
      })

      set(s => ({ workspaces: [...s.workspaces, ws] }))
      return { data: ws, error: null }
    } catch (e) {
      return { data: null, error: e }
    }
  },

  updateWorkspace: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      set(s => ({
        workspaces: s.workspaces.map(w => w.id === id ? { ...w, ...data } : w)
      }))
      return { error: null }
    } catch (e) {
      return { error: e }
    }
  },

  deleteWorkspace: async (id) => {
    try {
      const { error } = await supabase.from('workspaces').delete().eq('id', id)
      if (error) throw error
      set(s => ({
        workspaces: s.workspaces.filter(w => w.id !== id),
        activeWorkspaceId: s.activeWorkspaceId === id
          ? s.workspaces.find(w => w.id !== id)?.id || null
          : s.activeWorkspaceId
      }))
      return { error: null }
    } catch (e) {
      return { error: e }
    }
  },

  fetchMembers: async (workspaceId) => {
    const { data } = await supabase
      .from('workspace_members')
      .select('*, profiles(id, full_name, avatar_url, username)')
      .eq('workspace_id', workspaceId)
    set({ members: data || [] })
    return data || []
  },

  inviteMember: async (workspaceId, email, role = 'member') => {
    try {
      // Find user by email
      const { data: users, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id',
          (await supabase.auth.admin?.listUsers?.())?.data?.users
            ?.find(u => u.email === email)?.id
        )

      // Fallback: use auth RPC to find user by email
      const { data: authUser, error: rpcError } = await supabase
        .rpc('get_user_id_by_email', { email_input: email })

      if (!authUser) {
        return { error: { message: 'No user found with that email. They must sign up first.' } }
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', authUser)
        .single()

      if (existing) {
        return { error: { message: 'This user is already a member of this workspace.' } }
      }

      const { error } = await supabase.from('workspace_members').insert({
        workspace_id: workspaceId,
        user_id: authUser,
        role,
      })
      if (error) throw error

      await get().fetchMembers(workspaceId)
      return { error: null }
    } catch (e) {
      return { error: e }
    }
  },

  updateMemberRole: async (memberId, role, workspaceId) => {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('id', memberId)
    if (!error) await get().fetchMembers(workspaceId)
    return { error }
  },

  removeMember: async (memberId, workspaceId) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
    if (!error) await get().fetchMembers(workspaceId)
    return { error }
  },

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get()
    return workspaces.find(w => w.id === activeWorkspaceId) || null
  },
}))

export default useWorkspaceStore