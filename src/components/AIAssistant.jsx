import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, X, Send, Loader2, ChevronDown,
  Lightbulb, ListTodo, Calendar, Zap, Target
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'
import useTaskStore from '../store/useTaskStore'

const QUICK_ACTIONS = [
  { icon: Calendar,  label: 'Plan my day',          prompt: 'Based on my tasks, create a focused plan for today. Suggest what I should work on first and why.' },
  { icon: ListTodo,  label: 'Break down a task',    prompt: 'Help me break down my most complex task into smaller, actionable subtasks.' },
  { icon: Zap,       label: 'Prioritize my tasks',  prompt: 'Review my pending tasks and suggest the best priority order based on due dates and importance.' },
  { icon: Target,    label: 'Suggest habits',       prompt: 'Based on my current tasks and goals, suggest 3 new habits that would help me be more productive.' },
  { icon: Lightbulb, label: 'Productivity tips',    prompt: 'Give me 3 personalized productivity tips based on my tasks and habits.' },
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
          className="w-1.5 h-1.5 rounded-full bg-violet-400"
        />
      ))}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 mt-0.5 mr-2">
          <Sparkles size={11} className="text-white" />
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
        ${isUser
          ? 'bg-violet-600 text-white rounded-tr-sm'
          : 'bg-white/[0.05] border border-white/[0.08] text-slate-200 rounded-tl-sm'
        }`}
      >
        {msg.content.split('\n').map((line, i) => {
          // Bold **text**
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
              {parts.map((part, j) =>
                j % 2 === 1
                  ? <strong key={j} className="font-semibold text-white">{part}</strong>
                  : part
              )}
            </p>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function AIAssistant() {
  const user  = useAuthStore(s => s.user)
  const tasks = useTaskStore(s => s.tasks)

  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [habits,   setHabits]   = useState([])
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Load habits for context
  useEffect(() => {
    if (!user) return
    supabase.from('habits').select('name, streak, target_days')
      .eq('user_id', user.id).eq('is_active', true)
      .then(({ data }) => setHabits(data || []))
  }, [user])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  // Build context string from user's real data
  const buildContext = () => {
    const today = format(new Date(), 'EEEE, MMMM d yyyy')
    const pendingTasks = tasks.filter(t => t.status !== 'done').slice(0, 15)
    const doneTasks    = tasks.filter(t => t.status === 'done').length
    const overdue      = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    )

    return `You are an AI productivity assistant inside PlanPilot, a task management app.
Today is ${today}.

USER'S TASKS (pending):
${pendingTasks.map(t =>
  `- "${t.title}" [${t.priority || 'no priority'}] [${t.status}]${t.due_date ? ` due ${format(new Date(t.due_date), 'MMM d')}` : ''}`
).join('\n') || 'No pending tasks'}

COMPLETED TASKS: ${doneTasks} total
OVERDUE TASKS: ${overdue.map(t => `"${t.title}"`).join(', ') || 'none'}

USER'S HABITS:
${habits.map(h => `- "${h.name}" (${h.streak || 0} day streak)`).join('\n') || 'No habits yet'}

INSTRUCTIONS:
- Be concise, friendly, and actionable
- Use **bold** for task names and key points
- When suggesting subtasks or plans, use numbered lists
- Focus on practical advice the user can act on immediately
- Keep responses under 200 words unless a detailed breakdown is needed`
  }

  const sendMessage = async (content) => {
    if (!content.trim() || loading) return

    const userMsg = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1000,
          messages: [
            { role: 'system', content: buildContext() },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      })

      const data = await response.json()
      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (prompt) => {
    setMessages([]) // fresh context for quick actions
    sendMessage(prompt)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating bubble */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 md:bottom-6 right-5 z-50
          w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700
          shadow-2xl shadow-violet-900/60 flex items-center justify-center
          border border-violet-500/30"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x"  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} className="text-white" /></motion.div>
            : <motion.div key="ai" initial={{ rotate: 90,  opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Sparkles size={22} className="text-white" /></motion.div>
          }
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute inset-0 rounded-2xl bg-violet-500"
          />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 20  }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-44 md:bottom-24 right-5 z-50
              w-[calc(100vw-2.5rem)] max-w-sm
              bg-[#0e0e1c] border border-white/[0.08]
              rounded-3xl shadow-2xl shadow-black/70
              flex flex-col overflow-hidden"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]
              bg-gradient-to-r from-violet-600/10 to-purple-600/5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Assistant</p>
                <p className="text-[10px] text-slate-500">Powered by Claude</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex flex-col gap-2 h-full">
                  {/* Welcome */}
                  <div className="flex items-start gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={11} className="text-white" />
                    </div>
                    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                      <p className="text-sm text-slate-200 leading-relaxed">
                        Hi! I'm your AI productivity assistant. I can see your tasks and habits.
                        What can I help you with?
                      </p>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1 mt-1">
                    Quick actions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_ACTIONS.map(action => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                          bg-white/[0.03] border border-white/[0.06]
                          hover:bg-violet-600/10 hover:border-violet-500/20
                          text-slate-300 hover:text-white transition-all text-left group"
                      >
                        <action.icon size={14} className="text-violet-400 shrink-0" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                  {loading && (
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                        <Sparkles size={11} className="text-white" />
                      </div>
                      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Clear button (when messages exist) */}
            {messages.length > 0 && (
              <div className="px-3 pb-1 shrink-0">
                <button
                  onClick={() => setMessages([])}
                  className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Clear conversation
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 shrink-0">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08]
                rounded-2xl px-3.5 py-2.5 focus-within:border-violet-500/40 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600
                    outline-none resize-none leading-relaxed max-h-24"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all shrink-0 active:scale-95"
                >
                  {loading
                    ? <Loader2 size={14} className="text-white animate-spin" />
                    : <Send size={14} className="text-white" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-slate-700 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}