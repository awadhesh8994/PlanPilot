import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Sparkles, CheckCircle } from 'lucide-react'
import { Button, Input, useToast } from '../components/ui'
import useAuthStore from '../store/useAuthStore'

function Orbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-purple-700/10 rounded-full blur-[80px]" />
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
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
}

function PasswordStrength({ password }) {
  if (!password) return null

  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter',  pass: /[A-Z]/.test(password) },
    { label: 'One number',            pass: /[0-9]/.test(password) },
  ]
  const strength = checks.filter((c) => c.pass).length
  const barColors = ['bg-red-500', 'bg-amber-500', 'bg-emerald-500']
  const labels    = ['', 'Weak', 'Fair', 'Strong']
  const labelColors = ['', 'text-red-400', 'text-amber-400', 'text-emerald-400']

  return (
    <div className="mt-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? barColors[strength - 1] : 'bg-white/[0.08]'
            }`}
          />
        ))}
        <span className={`text-xs ml-1 w-10 ${labelColors[strength]}`}>
          {labels[strength]}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <CheckCircle
              size={11}
              className={`shrink-0 transition-colors ${c.pass ? 'text-emerald-400' : 'text-white/15'}`}
            />
            <span className={`text-xs transition-colors ${c.pass ? 'text-slate-400' : 'text-slate-600'}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuccessScreen({ email }) {
  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4">
      <Orbs />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative bg-white/[0.03] border border-white/[0.08] rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle size={30} className="text-emerald-400" />
        </motion.div>
        <h2 className="font-display text-xl font-bold text-white mb-2">Check your inbox!</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          We sent a confirmation link to{' '}
          <span className="text-white font-medium">{email}</span>.
          Click it to activate your account.
        </p>
        <Link
          to="/login"
          className="inline-block mt-6 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          Back to sign in →
        </Link>
      </motion.div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const signUp = useAuthStore((s) => s.signUp)

  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [errors, setErrors]       = useState({})
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  const validate = () => {
    const e = {}
    if (!fullName.trim())  e.fullName = 'Full name is required'
    if (!email)            e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password)         e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!confirm)          e.confirm  = 'Please confirm your password'
    else if (confirm !== password) e.confirm = 'Passwords do not match'
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

    const { data, error } = await signUp({
      email,
      password,
      fullName: fullName.trim(),
    })

    setLoading(false)

    if (error) {
      toast(error.message || 'Sign up failed. Please try again.', 'error')
    } else {
      // If email confirmation is OFF in Supabase, user is logged in immediately
      if (data?.session) {
        toast('Account created! Welcome 🎉', 'success')
        navigate('/dashboard')
      } else {
        // Email confirmation is ON — show success screen
        setDone(true)
      }
    }
  }

  if (done) return <SuccessScreen email={email} />

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
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="mb-7">
            <h1 className="font-display text-2xl font-bold text-white mb-1.5">Create account</h1>
            <p className="text-slate-400 text-sm">Start organizing your life for free</p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
              <Input
                label="Full name"
                type="text"
                placeholder="John Doe"
                icon={<User size={15} />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                autoComplete="name"
              />
            </motion.div>

            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
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

            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock size={15} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  autoComplete="new-password"
                />
                <PasswordStrength password={password} />
              </div>
            </motion.div>

            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={15} />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={errors.confirm}
                autoComplete="new-password"
              />
            </motion.div>

            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show" className="mt-1">
              <Button type="submit" fullWidth loading={loading} size="lg">
                Create account
              </Button>
            </motion.div>
          </form>

          <motion.p custom={8} variants={fadeUp} initial="hidden" animate="show" className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </motion.p>
        </motion.div>

        <motion.p custom={9} variants={fadeUp} initial="hidden" animate="show" className="text-center text-xs text-slate-700 mt-6">
          By signing up you agree to our Terms & Privacy Policy.
        </motion.p>
      </div>
    </div>
  )
}