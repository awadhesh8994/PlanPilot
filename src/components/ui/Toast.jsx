import { createContext, useCallback, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  error:   <XCircle    size={16} className="text-red-400 shrink-0" />,
  warning: <AlertCircle size={16} className="text-amber-400 shrink-0" />,
  info:    <Info        size={16} className="text-sky-400 shrink-0" />,
}

const borders = {
  success: 'border-emerald-500/30',
  error:   'border-red-500/30',
  warning: 'border-amber-500/30',
  info:    'border-sky-500/30',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.2 }}
              className={`
                pointer-events-auto flex items-start gap-3 px-4 py-3
                bg-[#16162a] border ${borders[t.type]} rounded-xl
                shadow-2xl shadow-black/50 max-w-sm w-full
              `}
            >
              {icons[t.type]}
              <p className="text-sm text-slate-200 flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-slate-500 hover:text-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}