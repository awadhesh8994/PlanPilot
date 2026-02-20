import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CheckSquare, Target, Timer,
  Settings, LogOut, Plus, ChevronDown,
  Sparkles, Users, Briefcase
} from 'lucide-react'
import { Avatar, Tooltip, ConfirmDialog, useToast } from './ui'
import useAuthStore from '../store/useAuthStore'
import useWorkspaceStore from '../store/useWorkspaceStore'
import useNotificationStore from '../store/usenotificationstore'
import NotificationPanel from '../components/notifications/NotificationPanel'
import { fromUnixTime } from 'date-fns'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: CheckSquare,     label: 'My Tasks',  to: '/tasks' },
  { icon: Target,          label: 'Habits',    to: '/habits' },
  { icon: Timer,           label: 'Pomodoro',  to: '/pomodoro' },
]

function NavItem({ icon: Icon, label, to }) {
  return (
    <NavLink to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150
        ${isActive
          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
        }
      `}
    >
      <Icon size={17} className="shrink-0" />
      {label}
    </NavLink>
  )
}

function WorkspaceSwitcher() {
  const user            = useAuthStore(s => s.user)
  const workspaces      = useWorkspaceStore(s => s.workspaces)
  const activeId        = useWorkspaceStore(s => s.activeWorkspaceId)
  const setActive       = useWorkspaceStore(s => s.setActiveWorkspace)
  const fetchWorkspaces = useWorkspaceStore(s => s.fetchWorkspaces)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user && workspaces.length === 0) fetchWorkspaces(user.id)
  }, [user])

  const current = workspaces.find(w => w.id === activeId) || workspaces[0]

  if (!current) return (
    <NavLink to="/workspaces"
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
        bg-white/[0.03] border border-dashed border-white/[0.08]
        text-slate-500 hover:text-slate-300 text-sm transition-all"
    >
      <Plus size={14} /> New workspace
    </NavLink>
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
          bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]
          transition-all duration-150 text-left"
      >
        <span className="text-base shrink-0">{current.icon || '📋'}</span>
        <span className="text-sm font-medium text-white flex-1 truncate">{current.name}</span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-[#16162a]
              border border-white/10 rounded-xl shadow-2xl z-50 p-1"
          >
            {workspaces.map(w => (
              <button key={w.id}
                onClick={() => { setActive(w.id); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                  text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
              >
                <span>{w.icon || '📋'}</span>
                <span className="flex-1 truncate">{w.name}</span>
                {w.id === activeId && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
              </button>
            ))}
            <div className="border-t border-white/[0.06] mt-1 pt-1">
              <NavLink to="/workspaces" onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                  text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Briefcase size={13} /> Manage workspaces
              </NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Sidebar() {
  const navigate     = useNavigate()
  const toast        = useToast()
  const profile      = useAuthStore(s => s.profile)
  const user         = useAuthStore(s => s.user)
  const signOut      = useAuthStore(s => s.signOut)
  const checkDue     = useNotificationStore(s => s.checkDueTaskReminders)
  const checkStreaks  = useNotificationStore(s => s.checkHabitStreaks)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Run notification checks once on mount
  useEffect(() => {
    if (!user) return
    checkDue(user.id)
    checkStreaks(user.id)
  }, [user])

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    setLoggingOut(false)
    toast('Logged out', 'success')
    navigate('/login')
  }

  return (
    <>
      <aside className="w-60 h-screen bg-[#0a0a14] border-r border-white/[0.06] flex flex-col shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              PlanPilot
            </span>
          </div>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1 mb-2">Workspace</p>
          <WorkspaceSwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1 mb-2">Menu</p>
          {navItems.map(item => <NavItem key={item.to} {...item} />)}

          <div className="mt-4">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1 mb-2">Spaces</p>
            <NavLink to="/workspaces"
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 border
                ${isActive
                  ? 'bg-violet-600/20 text-violet-300 border-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }
              `}
            >
              <Users size={17} /> Workspaces
            </NavLink>
          </div>
        </nav>

        {/* Bottom — notifications + user */}
        <div className="px-3 py-3 border-t border-white/[0.06] flex flex-col gap-1">

          {/* Notification bell row */}
          <div className="flex items-center gap-2 px-3 py-2">
            <NotificationPanel />
            <span className="text-sm text-slate-400">Notifications</span>
          </div>

          <NavLink to="/settings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400
              hover:text-white hover:bg-white/5 transition-all border border-transparent"
          >
            <Settings size={16} /> Settings
          </NavLink>

          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] mt-1">
            <Avatar name={profile?.full_name || 'User'} src={profile?.avatar_url} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{profile?.full_name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{profile?.username || 'Free plan'}</p>
            </div>
            <Tooltip text="Log out" placement="top">
              <button onClick={() => setShowLogout(true)}
                className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                <LogOut size={14} />
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={showLogout} onClose={() => setShowLogout(false)}
        onConfirm={handleLogout} title="Log out?"
        description="You'll need to sign in again to access your tasks."
        confirmLabel="Log out" loading={loggingOut}
      />
    </>
  )
}