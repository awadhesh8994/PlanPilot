import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Settings, Users, Trash2, Crown,
  Shield, User, MoreHorizontal, Mail,
  CheckSquare, Edit3, X, Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'
import useWorkspaceStore from '../store/useWorkspaceStore'
import useTaskStore from '../store/useTaskStore'
import DashboardLayout from '../components/DashboardLayout'
import {
  Avatar, Badge, Button, Input, Modal,
  ConfirmDialog, Dropdown, useToast, EmptyState
} from '../components/ui'

const ICONS  = ['📋','🏠','💼','🚀','🎯','🔥','💡','🌟','🎨','📊','🛠️','🌱']
const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6']

const ROLE_META = {
  owner:  { label: 'Owner',  icon: Crown,  color: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  admin:  { label: 'Admin',  icon: Shield, color: 'text-sky-400    bg-sky-500/10    border-sky-500/20'    },
  member: { label: 'Member', icon: User,   color: 'text-slate-400  bg-slate-500/10  border-slate-500/20'  },
  viewer: { label: 'Viewer', icon: User,   color: 'text-slate-500  bg-slate-500/8   border-slate-500/15'  },
}

// ── Create Workspace Modal ────────────────────────────────────────────────────
function CreateWorkspaceModal({ open, onClose, onSuccess }) {
  const toast         = useToast()
  const user          = useAuthStore(s => s.user)
  const createWs      = useWorkspaceStore(s => s.createWorkspace)

  const [name,    setName]    = useState('')
  const [icon,    setIcon]    = useState('📋')
  const [color,   setColor]   = useState('#6366f1')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (open) { setName(''); setIcon('📋'); setColor('#6366f1'); setError('') }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Workspace name is required'); return }
    setLoading(true)
    const { data, error: err } = await createWs({ name: name.trim(), icon, color, userId: user.id })
    setLoading(false)
    if (err) toast(err.message, 'error')
    else { toast(`"${data.name}" created!`, 'success'); onSuccess(data); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Workspace" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <input
            autoFocus value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Workspace name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-white placeholder:text-slate-600 outline-none
              focus:border-violet-500/50 transition-all"
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        {/* Icon */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Icon</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center
                  transition-all border ${icon === ic
                    ? 'bg-violet-600/30 border-violet-500/50 scale-110'
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
              >{ic}</button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Color</p>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c ? 'scale-125 ring-2 ring-white/30 ring-offset-2 ring-offset-[#111120]' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: color + '30', border: `1px solid ${color}40` }}>
            {icon}
          </div>
          <span className="text-sm font-medium text-white">{name || 'Workspace name'}</span>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Invite Member Modal ───────────────────────────────────────────────────────
function InviteMemberModal({ open, onClose, workspaceId, onSuccess }) {
  const toast       = useToast()
  const inviteMember = useWorkspaceStore(s => s.inviteMember)

  const [email,   setEmail]   = useState('')
  const [role,    setRole]    = useState('member')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => { if (open) { setEmail(''); setRole('member'); setError('') } }, [open])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return }

    setLoading(true)
    const { error: err } = await inviteMember(workspaceId, email.trim(), role)
    setLoading(false)

    if (err) { setError(err.message) }
    else { toast(`${email} added to workspace!`, 'success'); onSuccess(); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Member" size="sm">
      <form onSubmit={handleInvite} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="colleague@example.com"
          icon={<Mail size={14} />}
          error={error}
          autoFocus
        />

        {/* Role selector */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Role</p>
          <div className="flex gap-2">
            {['admin','member','viewer'].map(r => {
              const meta = ROLE_META[r]
              return (
                <button
                  key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl
                    border text-xs font-medium transition-all ${
                    role === r
                      ? 'bg-violet-600/20 border-violet-500/30 text-violet-300'
                      : 'bg-white/[0.02] border-white/[0.07] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <meta.icon size={14} />
                  {meta.label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {role === 'admin'  && 'Can manage tasks and invite members'}
            {role === 'member' && 'Can create and edit tasks'}
            {role === 'viewer' && 'Can only view tasks'}
          </p>
        </div>

        <div className="flex gap-3 mt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth loading={loading}>Send invite</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Member row ────────────────────────────────────────────────────────────────
function MemberRow({ member, isOwner, currentUserId, workspaceId, onUpdate }) {
  const toast          = useToast()
  const updateRole     = useWorkspaceStore(s => s.updateMemberRole)
  const removeMember   = useWorkspaceStore(s => s.removeMember)
  const [showRemove, setShowRemove] = useState(false)
  const [removing,   setRemoving]   = useState(false)

  const profile  = member.profiles
  const meta     = ROLE_META[member.role] || ROLE_META.member
  const isSelf   = member.user_id === currentUserId
  const isWsOwner = member.role === 'owner'

  const handleRoleChange = async (newRole) => {
    const { error } = await updateRole(member.id, newRole, workspaceId)
    if (error) toast(error.message, 'error')
    else { toast('Role updated', 'success'); onUpdate() }
  }

  const handleRemove = async () => {
    setRemoving(true)
    const { error } = await removeMember(member.id, workspaceId)
    setRemoving(false)
    if (error) toast(error.message, 'error')
    else { toast('Member removed', 'success'); setShowRemove(false); onUpdate() }
  }

  const roleMenuItems = ['admin','member','viewer']
    .filter(r => r !== member.role)
    .map(r => {
      const IconComponent = ROLE_META[r].icon
      return {
        label: `Change to ${ROLE_META[r].label}`,
        icon: <IconComponent size={14} />,
        onClick: () => handleRoleChange(r),
      }
    })

  const menuItems = [
    ...roleMenuItems,
    ...(roleMenuItems.length ? [{ divider: true }] : []),
    {
      label: isSelf ? 'Leave workspace' : 'Remove member',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => setShowRemove(true),
    },
  ]

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-all group">
        <Avatar name={profile?.full_name} src={profile?.avatar_url} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {profile?.full_name || 'Unknown'}
            {isSelf && <span className="text-xs text-slate-600 ml-1.5">(you)</span>}
          </p>
          <p className="text-xs text-slate-600 truncate">{profile?.username || '—'}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.color}`}>
          <meta.icon size={11} />
          {meta.label}
        </div>
        {!isWsOwner && isOwner && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Dropdown align="right"
              trigger={
                <button className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                  <MoreHorizontal size={15} />
                </button>
              }
              items={menuItems}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showRemove}
        onClose={() => setShowRemove(false)}
        onConfirm={handleRemove}
        loading={removing}
        title={isSelf ? 'Leave workspace?' : 'Remove member?'}
        description={isSelf
          ? "You'll lose access to this workspace and its tasks."
          : `${profile?.full_name || 'This member'} will lose access to this workspace.`
        }
        confirmLabel={isSelf ? 'Leave' : 'Remove'}
      />
    </>
  )
}

// ── Workspace card ────────────────────────────────────────────────────────────
function WorkspaceCard({ workspace, isActive, onClick, onSettings }) {
  const user        = useAuthStore(s => s.user)
  const isOwner     = workspace.owner_id === user?.id
  const [taskCount, setTaskCount] = useState(null)
  const [memCount,  setMemCount]  = useState(null)

  useEffect(() => {
    supabase.from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .then(({ count }) => setTaskCount(count || 0))

    supabase.from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .then(({ count }) => setMemCount(count || 0))
  }, [workspace.id])

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
        isActive
          ? 'border-violet-500/30 bg-violet-600/10'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
      }`}
    >
      {isActive && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-400" />
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: (workspace.color || '#6366f1') + '25', border: `1px solid ${workspace.color || '#6366f1'}30` }}>
          {workspace.icon || '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{workspace.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{isOwner ? 'Owner' : (workspace._role || 'Member')}</p>
        </div>
        {isOwner && (
          <button
            onClick={e => { e.stopPropagation(); onSettings(workspace) }}
            className="text-slate-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <Settings size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CheckSquare size={12} />
          {taskCount ?? '—'} tasks
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users size={12} />
          {memCount ?? '—'} members
        </div>
      </div>
    </motion.div>
  )
}

// ── Settings panel ────────────────────────────────────────────────────────────
function WorkspaceSettings({ workspace, onClose, onUpdate }) {
  const toast       = useToast()
  const user        = useAuthStore(s => s.user)
  const updateWs    = useWorkspaceStore(s => s.updateWorkspace)
  const deleteWs    = useWorkspaceStore(s => s.deleteWorkspace)
  const fetchMems   = useWorkspaceStore(s => s.fetchMembers)
  const members     = useWorkspaceStore(s => s.members)

  const [name,       setName]       = useState(workspace.name)
  const [icon,       setIcon]       = useState(workspace.icon || '📋')
  const [color,      setColor]      = useState(workspace.color || '#6366f1')
  const [showInvite, setShowInvite] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const isOwner = workspace.owner_id === user?.id

  useEffect(() => {
    fetchMems(workspace.id)
    setName(workspace.name)
    setIcon(workspace.icon || '📋')
    setColor(workspace.color || '#6366f1')
  }, [workspace.id])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateWs(workspace.id, { name: name.trim(), icon, color })
    setSaving(false)
    if (error) toast(error.message, 'error')
    else { toast('Workspace updated!', 'success'); onUpdate() }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteWs(workspace.id)
    setDeleting(false)
    if (error) toast(error.message, 'error')
    else { toast('Workspace deleted', 'success'); onClose() }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Name + icon + color */}
      {isOwner && (
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-white">General</h3>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-white outline-none focus:border-violet-500/50 transition-all"
          />
          <div>
            <p className="text-xs text-slate-500 mb-2">Icon</p>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center
                    border transition-all ${icon === ic
                      ? 'bg-violet-600/30 border-violet-500/50 scale-110'
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                >{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Color</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'scale-125 ring-2 ring-white/30 ring-offset-2 ring-offset-[#0a0a14]' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleSave} loading={saving} size="sm" icon={<Check size={14} />}>
            Save changes
          </Button>
        </div>
      )}

      {/* Members */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-white">Members</h3>
            <span className="text-xs text-slate-600">({members.length})</span>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20
                border border-violet-500/20 text-violet-300 text-xs font-medium
                hover:bg-violet-600/30 transition-all"
            >
              <Plus size={12} /> Invite
            </button>
          )}
        </div>
        <div>
          {members.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              isOwner={isOwner}
              currentUserId={user?.id}
              workspaceId={workspace.id}
              onUpdate={() => fetchMems(workspace.id)}
            />
          ))}
        </div>
      </div>

      {/* Danger zone */}
      {isOwner && !workspace.is_personal && (
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Danger Zone</h3>
          <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
            <div>
              <p className="text-sm text-red-400 font-medium">Delete workspace</p>
              <p className="text-xs text-slate-500 mt-0.5">Deletes all tasks inside</p>
            </div>
            <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setShowDelete(true)}>
              Delete
            </Button>
          </div>
        </div>
      )}

      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        workspaceId={workspace.id}
        onSuccess={() => fetchMems(workspace.id)}
      />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete workspace?"
        description="This will permanently delete the workspace and ALL tasks inside it."
        confirmLabel="Delete workspace"
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkspacesPage() {
  const toast            = useToast()
  const user             = useAuthStore(s => s.user)
  const workspaces       = useWorkspaceStore(s => s.workspaces)
  const activeId         = useWorkspaceStore(s => s.activeWorkspaceId)
  const loading          = useWorkspaceStore(s => s.loading)
  const fetchWorkspaces  = useWorkspaceStore(s => s.fetchWorkspaces)
  const setActive        = useWorkspaceStore(s => s.setActiveWorkspace)

  const [showCreate,    setShowCreate]    = useState(false)
  const [settingsWs,    setSettingsWs]    = useState(null) // workspace being edited

  useEffect(() => { if (user) fetchWorkspaces(user.id) }, [user])

  const personal  = workspaces.filter(w => w.is_personal)
  const shared    = workspaces.filter(w => !w.is_personal)

  return (
    <DashboardLayout>
      <div className="px-8 py-7 max-w-[1000px] mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Workspaces</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your spaces and collaborate with others</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600
              hover:bg-violet-500 text-white text-sm font-medium shadow-lg
              shadow-violet-900/40 transition-all"
          >
            <Plus size={16} /> New workspace
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — workspace list */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Personal */}
            {personal.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">Personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {personal.map(ws => (
                    <WorkspaceCard
                      key={ws.id} workspace={ws}
                      isActive={activeId === ws.id}
                      onClick={() => setActive(ws.id)}
                      onSettings={setSettingsWs}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shared */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3">
                Shared {shared.length > 0 && `(${shared.length})`}
              </p>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : shared.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="No shared workspaces"
                  description="Create a workspace and invite teammates to collaborate"
                  action={{ label: '+ New workspace', onClick: () => setShowCreate(true) }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatePresence>
                    {shared.map(ws => (
                      <WorkspaceCard
                        key={ws.id} workspace={ws}
                        isActive={activeId === ws.id}
                        onClick={() => setActive(ws.id)}
                        onSettings={setSettingsWs}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Right — settings panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {settingsWs ? (
                <motion.div
                  key={settingsWs.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{settingsWs.icon}</span>
                      <h2 className="text-sm font-semibold text-white">{settingsWs.name}</h2>
                    </div>
                    <button
                      onClick={() => setSettingsWs(null)}
                      className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <WorkspaceSettings
                    workspace={settingsWs}
                    onClose={() => setSettingsWs(null)}
                    onUpdate={() => fetchWorkspaces(user.id)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-48 flex items-center justify-center border border-dashed
                    border-white/[0.07] rounded-2xl"
                >
                  <div className="text-center">
                    <Settings size={24} className="text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click ⚙️ on a workspace to manage it</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <CreateWorkspaceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => fetchWorkspaces(user.id)}
      />
    </DashboardLayout>
  )
}