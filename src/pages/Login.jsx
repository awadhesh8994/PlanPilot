import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Sparkles } from 'lucide-react'
import { Button, Input, useToast } from '../components/ui'
import useAuthStore from '../store/useAuthStore'

function Orbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -right-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-700/10 rounded-full blur-[80px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

export default function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const signIn = useAuthStore((s) => s.signIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setErrors({})

    const { data, error } = await signIn({ email, password })

    setLoading(false)

    if (error) {
      toast(error.message || 'Login failed. Please try again.', 'error')
    } else if (data?.user) {
      toast('Welcome back! 👋', 'success')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <Orbs />

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="flex items-center justify-center gap-2.5 mb-10"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-white tracking-tight">PlanPilot</span>
        </motion.div>

        {/* Card */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/60 backdrop-blur-sm"
        >
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
            <h1 className="font-display text-2xl font-bold text-white mb-1.5">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to continue to your workspace</p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail size={15} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
              />
            </motion.div>

            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={15} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
              />
            </motion.div>

            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="flex justify-end -mt-1">
              <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </motion.div>

            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" className="mt-1">
              <Button type="submit" fullWidth loading={loading} size="lg">
                Sign in
              </Button>
            </motion.div>
          </form>

          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show" className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </motion.div>

          <motion.p custom={8} variants={fadeUp} initial="hidden" animate="show" className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one free
            </Link>
          </motion.p>
        </motion.div>

        <motion.p custom={9} variants={fadeUp} initial="hidden" animate="show" className="text-center text-xs text-slate-700 mt-6">
          Your tasks, beautifully organized.
        </motion.p>
      </div>
    </div>
  )
}