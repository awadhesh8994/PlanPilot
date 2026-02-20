import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dropdown({ trigger, items, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const alignClass = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 mt-2 min-w-[180px] ${alignClass}
              bg-[#16162a] border border-white/10 rounded-xl shadow-2xl
              shadow-black/50 overflow-hidden p-1
            `}
          >
            {items.map((item, i) =>
              item.divider ? (
                <div key={i} className="my-1 border-t border-white/8" />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.onClick?.(); setOpen(false) }}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg
                    transition-colors duration-150 text-left
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${item.danger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  {item.icon && <span className="shrink-0 text-current">{item.icon}</span>}
                  {item.label}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}