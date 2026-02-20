import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'

const MODES = {
  work:        { label: 'Focus',       minutes: 25, color: '#7c3aed' },
  short_break: { label: 'Short Break', minutes: 5,  color: '#0ea5e9' },
  long_break:  { label: 'Long Break',  minutes: 15, color: '#059669' },
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function PomodoroWidget() {
  const [mode, setMode]       = useState('work')
  const [running, setRunning] = useState(false)
  const [secs, setSecs]       = useState(MODES.work.minutes * 60)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)

  const total    = MODES[mode].minutes * 60
  const progress = ((total - secs) / total) * 100
  const color    = MODES[mode].color

  // Circumference for the SVG circle
  const r  = 52
  const circ = 2 * Math.PI * r
  const dash = circ - (circ * progress) / 100

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode === 'work') setSessions(n => n + 1)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  const switchMode = (m) => {
    setRunning(false)
    setMode(m)
    setSecs(MODES[m].minutes * 60)
  }

  const reset = () => {
    setRunning(false)
    setSecs(MODES[mode].minutes * 60)
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Pomodoro</h2>
        <span className="text-xs text-slate-500">{sessions} sessions today</span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-5 bg-white/[0.03] p-1 rounded-xl">
        {Object.entries(MODES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              mode === key
                ? 'bg-white/10 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
            <motion.circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 0.5, ease: 'linear' }}
              style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white font-display tabular-nums">
              {formatTime(secs)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">
              {MODES[mode].label}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10
              text-slate-400 hover:text-white hover:bg-white/10 transition-all
              flex items-center justify-center"
          >
            <RotateCcw size={14} />
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setRunning(r => !r)}
            className="w-12 h-12 rounded-full flex items-center justify-center
              text-white font-medium shadow-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}bb)`,
              boxShadow: `0 4px 20px ${color}40`
            }}
          >
            {running ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </motion.button>

          <button
            onClick={() => switchMode(mode === 'work' ? 'short_break' : 'work')}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10
              text-slate-400 hover:text-white hover:bg-white/10 transition-all
              flex items-center justify-center"
          >
            {mode === 'work' ? <Coffee size={14} /> : <Brain size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}