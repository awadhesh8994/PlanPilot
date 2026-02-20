import { motion } from 'framer-motion'
import { Target, Plus, Flame } from 'lucide-react'
import { EmptyState } from '../ui'

function HabitRow({ habit, onCheck, checked }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group">
      <span className="text-base shrink-0">{habit.icon || '⭐'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 truncate">{habit.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Flame size={10} className="text-amber-400" />
          <span className="text-[10px] text-slate-600">{habit.streak || 0} day streak</span>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onCheck(habit.id)}
        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center
          transition-all duration-200 shrink-0
          ${checked
            ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
            : 'border-white/10 hover:border-white/25'
          }`}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            width="12" height="12" viewBox="0 0 12 12" fill="none"
          >
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </motion.button>
    </div>
  )
}

export default function HabitWidget({ habits = [], checkedIds = [], onCheck, onAdd }) {
  const completedCount = habits.filter(h => checkedIds.includes(h.id)).length
  const progress = habits.length ? Math.round((completedCount / habits.length) * 100) : 0

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-white">Habits</h2>
        </div>
        <div className="flex items-center gap-3">
          {habits.length > 0 && (
            <span className="text-xs text-slate-500">{completedCount}/{habits.length} done</span>
          )}
          <button
            onClick={onAdd}
            className="text-slate-500 hover:text-violet-400 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {habits.length > 0 && (
        <div className="px-5 py-2.5 border-b border-white/[0.04]">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </div>
        </div>
      )}

      <div className="p-2">
        {habits.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No habits yet"
            description="Track your daily habits here"
            action={{ label: 'Add habit', onClick: onAdd }}
          />
        ) : (
          habits.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              checked={checkedIds.includes(habit.id)}
              onCheck={onCheck}
            />
          ))
        )}
      </div>
    </div>
  )
}