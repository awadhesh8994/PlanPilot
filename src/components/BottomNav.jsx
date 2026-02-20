import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Target, Timer, Users } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Home',     to: '/dashboard' },
  { icon: CheckSquare,     label: 'Tasks',    to: '/tasks' },
  { icon: Target,          label: 'Habits',   to: '/habits' },
  { icon: Timer,           label: 'Pomodoro', to: '/pomodoro' },
  { icon: Users,           label: 'Spaces',   to: '/workspaces' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-[#0a0a14]/90 backdrop-blur-xl border-t border-white/[0.07]" />
      <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[52px]
              transition-all duration-200
              ${isActive ? 'text-violet-300' : 'text-slate-500 active:text-slate-300'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-0 -m-2 rounded-xl bg-violet-600/20"
                    />
                  )}
                  <Icon size={20} className="relative z-10" />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}