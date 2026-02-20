import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, CheckCheck, Trash2,
  Calendar, UserPlus, CheckSquare, Flame, X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import useNotificationStore from '../../store/usenotificationstore'
import useAuthStore from '../../store/useAuthStore'

const TYPE_META = {
  reminder:      { icon: Calendar,    color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  task_assigned: { icon: CheckSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  collab_invite: { icon: UserPlus,    color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
  mention:       { icon: Bell,        color: 'text-pink-400',   bg: 'bg-pink-500/10'   },
  streak_broken: { icon: Flame,       color: 'text-orange-400', bg: 'bg-orange-500/10' },
}

function NotifItem({ notif, onRead, onClose }) {
  const navigate = useNavigate()
  const meta = TYPE_META[notif.type] || TYPE_META.reminder
  const Icon = meta.icon

  const handleClick = () => {
    if (!notif.is_read) onRead(notif.id)
    if (notif.link) { navigate(notif.link); onClose() }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer
        hover:bg-white/[0.03] transition-all group relative
        ${!notif.is_read ? 'bg-white/[0.02]' : ''}`}
    >
      {/* Unread dot */}
      {!notif.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-violet-400" />
      )}

      {/* Icon */}
      <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={14} className={meta.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notif.is_read ? 'text-slate-400' : 'text-white font-medium'}`}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>
        )}
        <p className="text-[10px] text-slate-600 mt-1">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Mark read on hover */}
      {!notif.is_read && (
        <button
          onClick={e => { e.stopPropagation(); onRead(notif.id) }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg
            text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10
            transition-all shrink-0"
        >
          <Check size={13} />
        </button>
      )}
    </motion.div>
  )
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const user          = useAuthStore(s => s.user)
  const notifications = useNotificationStore(s => s.notifications)
  const unreadCount   = useNotificationStore(s => s.unreadCount)
  const loading       = useNotificationStore(s => s.loading)
  const fetchNotifs   = useNotificationStore(s => s.fetchNotifications)
  const markAsRead    = useNotificationStore(s => s.markAsRead)
  const markAllRead   = useNotificationStore(s => s.markAllAsRead)
  const clearAll      = useNotificationStore(s => s.clearAll)
  const subscribeRT   = useNotificationStore(s => s.subscribeRealtime)

  // Load + subscribe on mount
  useEffect(() => {
    if (!user) return
    fetchNotifs(user.id)
    const unsub = subscribeRT(user.id)
    return unsub
  }, [user])

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const unread = notifications.filter(n => !n.is_read)
  const read   = notifications.filter(n => n.is_read)

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl
          transition-all duration-150 border
          ${open
            ? 'bg-violet-600/20 border-violet-500/20 text-violet-300'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
          }`}
      >
        <Bell size={17} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full
                bg-violet-500 flex items-center justify-center"
            >
              <span className="text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-2 top-0 w-80 bg-[#111120] border border-white/10
              rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    bg-violet-500/20 text-violet-300 border border-violet-500/20">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead(user.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]
                      text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    <CheckCheck size={12} /> All read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => clearAll(user.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400
                      hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-white
                    hover:bg-white/5 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col gap-1 p-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-white/[0.02] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Bell size={18} className="text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500">All caught up!</p>
                  <p className="text-xs text-slate-700">No notifications yet</p>
                </div>
              ) : (
                <AnimatePresence>
                  {/* Unread section */}
                  {unread.length > 0 && (
                    <>
                      <p className="px-4 py-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                        New
                      </p>
                      {unread.map(n => (
                        <NotifItem
                          key={n.id} notif={n}
                          onRead={markAsRead}
                          onClose={() => setOpen(false)}
                        />
                      ))}
                    </>
                  )}

                  {/* Read section */}
                  {read.length > 0 && (
                    <>
                      <p className="px-4 py-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest border-t border-white/[0.05] mt-1 pt-3">
                        Earlier
                      </p>
                      {read.map(n => (
                        <NotifItem
                          key={n.id} notif={n}
                          onRead={markAsRead}
                          onClose={() => setOpen(false)}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}