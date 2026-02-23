import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, LogOut, Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { ConfirmDialog, useToast } from './ui'
import useAuthStore from '../store/useAuthStore'
import useNotificationStore from '../store/usenotificationstore'
import AIAssistant from './AIAssistant'

function MobileTopBar({ onMenuOpen }) {
  const navigate     = useNavigate()
  const toast        = useToast()
  const signOut      = useAuthStore(s => s.signOut)
  const unreadCount  = useNotificationStore(s => s.unreadCount)
  const [showLogout, setShowLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    setLoggingOut(false)
    toast('Logged out', 'success')
    navigate('/login')
  }

  return (
    <>
      <div className="md:hidden flex items-center justify-between px-4 py-3
        bg-[#0a0a14] border-b border-white/[0.06] shrink-0">

        {/* Hamburger */}
        <button
          onClick={onMenuOpen}
          className="p-2 rounded-xl text-slate-400 hover:text-white
            hover:bg-white/5 transition-all active:scale-95"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <span className="font-bold text-white text-base"
          style={{ fontFamily: 'Syne, sans-serif' }}>
          PlanPilot
        </span>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white
              hover:bg-white/5 transition-all active:scale-95"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogout(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400
              hover:bg-red-500/10 transition-all active:scale-95"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
        title="Log out?"
        description="You'll need to sign in again to access your tasks."
        confirmLabel="Log out"
      />
    </>
  )
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        body { font-family: 'DM Sans', sans-serif; background: #080810; }
        .font-display { font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        .pb-safe { padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); }
      `}</style>

      {/* Desktop sidebar (md+) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-screen z-50 md:hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar — now has logout + bell */}
        <MobileTopBar onMenuOpen={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* AI Assistant — visible on all pages */}
      <AIAssistant />
    </div>
  )
}