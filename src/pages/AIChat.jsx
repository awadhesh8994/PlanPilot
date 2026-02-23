import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Loader2, Trash2,
  Lightbulb, ListTodo, Calendar, Zap, Target, Bot
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'
import useTaskStore from '../store/useTaskStore'
import DashboardLayout from '../components/DashboardLayout'

const QUICK_ACTIONS = [
  { icon: Calendar,  color: 'text-violet-400 bg-violet-500/10', label: 'Plan my day',         prompt: 'Based on my tasks, create a focused plan for today. Suggest what I should work on first and why.' },
  { icon: ListTodo,  color: 'text-sky-400    bg-sky-500/10',    label: 'Break down a task',   prompt: 'Help me break down my most complex pending task into smaller, actionable subtasks.' },
  { icon: Zap,       color: 'text-amber-400  bg-amber-500/10',  label: 'Prioritize tasks',    prompt: 'Review my pending tasks and suggest the best priority order based on due dates and importance.' },
  { icon: Target,    color: 'text-emerald-400 bg-emerald-500/10',label: 'Suggest habits',     prompt: 'Based on my current tasks and goals, suggest 3 new habits that would make me more productive.' },
  { icon: Lightbulb, color: 'text-pink-400   bg-pink-500/10',   label: 'Productivity tips',  prompt: 'Give me 3 personalized productivity tips based on my tasks and current habits.' },
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0,1,2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
          className="w-2 h-2 rounded-full bg-violet-400"
        />
      ))}
    </div>
  )
}

function Message({ msg, isLast }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700
          flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-violet-900/40">
          <Sparkles size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-violet-600 text-white rounded-tr-sm shadow-lg shadow-violet-900/30'
          : 'bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-tl-sm'
      }`}>
        {msg.content.split('\n').map((line, i) => {
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i} className={i > 0 && line ? 'mt-2' : i > 0 ? 'mt-1' : ''}>
              {parts.map((part, j) =>
                j % 2 === 1
                  ? <strong key={j} className="font-semibold text-white">{part}</strong>
                  : part
              )}
            </p>
          )
        })}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08]
          flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-slate-400">
          U
        </div>
      )}
    </motion.div>
  )
}

function EmptyState({ onQuickAction }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 gap-6">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700
          flex items-center justify-center shadow-2xl shadow-violet-900/50">
          <Sparkles size={28} className="text-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute inset-0 rounded-2xl bg-violet-500"
        />
      </motion.div>

      <div className="text-center">
        <h2 className="text-lg font-bold text-white font-display">AI Assistant</h2>
        <p className="text-sm text-slate-500 mt-1.5 max-w-xs leading-relaxed">
          I know your tasks and habits. Ask me anything or pick a quick action below.
        </p>
      </div>

      {/* Quick actions grid */}
      <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onQuickAction(action.prompt)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl
              bg-white/[0.03] border border-white/[0.07]
              hover:bg-violet-600/10 hover:border-violet-500/25
              text-left transition-all group active:scale-[0.98]"
          >
            <div className={`w-8 h-8 rounded-lg ${action.color.split(' ')[1]}
              flex items-center justify-center shrink-0`}>
              <action.icon size={15} className={action.color.split(' ')[0]} />
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default function AIChat() {
  const user  = useAuthStore(s => s.user)
  const tasks = useTaskStore(s => s.tasks)

  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [habits,   setHabits]   = useState([])
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  useEffect(() => {
    if (!user) return
    supabase.from('habits').select('name, streak, target_days')
      .eq('user_id', user.id).eq('is_active', true)
      .then(({ data }) => setHabits(data || []))
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const buildContext = () => {
    const today = format(new Date(), 'EEEE, MMMM d yyyy')
    const pending = tasks.filter(t => t.status !== 'done').slice(0, 15)
    const done    = tasks.filter(t => t.status === 'done').length
    const overdue = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    )
    return `You are an AI productivity assistant inside Taskly, a task management app.
Today is ${today}.

USER'S PENDING TASKS:
${pending.map(t =>
  `- "${t.title}" [${t.priority || 'no priority'}] [${t.status}]${t.due_date ? ` due ${format(new Date(t.due_date), 'MMM d')}` : ''}`
).join('\n') || 'No pending tasks'}

COMPLETED TASKS: ${done} total
OVERDUE: ${overdue.map(t => `"${t.title}"`).join(', ') || 'none'}

USER'S HABITS:
${habits.map(h => `- "${h.name}" (${h.streak || 0} day streak)`).join('\n') || 'No habits yet'}

INSTRUCTIONS:
- Be concise, warm, and actionable
- Use **bold** for task names and key points  
- Use numbered lists for steps or plans
- Keep responses under 250 words unless a detailed breakdown is needed
- Always end with 1 encouraging sentence`
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
      const data  = await response.json()
      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond. Try again!"
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Check your API key and try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5
            border-b border-white/[0.06] shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700
              flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg md:text-xl font-bold text-white">AI Assistant</h1>
              <p className="text-xs text-slate-500">Powered by Llama 3.3 · Free</p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs
                text-slate-500 hover:text-red-400 hover:bg-red-500/10
                border border-white/[0.06] transition-all"
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </motion.div>

        {/* Messages / Empty state */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onQuickAction={(prompt) => sendMessage(prompt)} />
          ) : (
            <div className="px-4 md:px-8 py-6 flex flex-col gap-4 max-w-3xl mx-auto w-full">
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} isLast={i === messages.length - 1} />
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700
                    flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 px-4 md:px-8 py-4 border-t border-white/[0.06]
          bg-[#080810]/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            {/* Quick action chips (shown when chatting) */}
            {messages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_ACTIONS.map(a => (
                  <button key={a.label}
                    onClick={() => sendMessage(a.prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-white/[0.04] border border-white/[0.08] text-xs text-slate-400
                      hover:text-white hover:border-violet-500/30 hover:bg-violet-600/10
                      transition-all whitespace-nowrap shrink-0"
                  >
                    <a.icon size={11} />
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-3 bg-white/[0.04] border border-white/[0.08]
              rounded-2xl px-4 py-3 focus-within:border-violet-500/40 transition-all">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  // Auto-resize
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your tasks, habits, or productivity..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600
                  outline-none resize-none leading-relaxed min-h-[24px]"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all shrink-0 active:scale-95 mb-0.5"
              >
                {loading
                  ? <Loader2 size={16} className="text-white animate-spin" />
                  : <Send size={16} className="text-white" />
                }
              </button>
            </div>
            <p className="text-[10px] text-slate-700 text-center mt-2">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}