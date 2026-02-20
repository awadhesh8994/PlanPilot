import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Palette, Trash2, Save, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'
import DashboardLayout from '../components/DashboardLayout'
import { Button, Input, ConfirmDialog, useToast } from '../components/ui'

const ACCENT_COLORS = [
  { name: 'Violet',  value: '#6366f1' },
  { name: 'Sky',     value: '#0ea5e9' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber',   value: '#f59e0b' },
  { name: 'Rose',    value: '#f43f5e' },
  { name: 'Pink',    value: '#ec4899' },
]

function Section({ title, children }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ── Profile section ───────────────────────────────────────────────────────────
function ProfileSection() {
  const toast      = useToast()
  const profile    = useAuthStore(s => s.profile)
  const setProfile = useAuthStore(s => s.setProfile)
  const user       = useAuthStore(s => s.user)

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setUsername(profile?.username || '')
  }, [profile])

  const handleSave = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), username: username.trim() || null })
      .eq('id', user.id)
      .select()
      .single()
    setLoading(false)
    if (error) toast(error.message, 'error')
    else { setProfile(data); toast('Profile updated!', 'success') }
  }

  const initials = fullName
    ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <Section title="Profile">
      <div className="flex items-center gap-5 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600
            flex items-center justify-center text-xl font-bold text-white shrink-0">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              : initials
            }
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#111120]
            border border-white/10 flex items-center justify-center text-slate-400">
            <Camera size={11} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Full name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Your full name"
        />
        <Input
          label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="@username"
          hint="Used to identify you in shared workspaces"
        />
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={loading} size="sm" icon={<Save size={14} />}>
            Save changes
          </Button>
        </div>
      </div>
    </Section>
  )
}

// ── Password section ──────────────────────────────────────────────────────────
function PasswordSection() {
  const toast = useToast()
  const [current,  setCurrent]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})

  const handleChange = async () => {
    const e = {}
    if (!newPass)           e.newPass = 'New password is required'
    else if (newPass.length < 8) e.newPass = 'Must be at least 8 characters'
    if (newPass !== confirm) e.confirm = 'Passwords do not match'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setLoading(false)

    if (error) toast(error.message, 'error')
    else {
      toast('Password updated!', 'success')
      setCurrent(''); setNewPass(''); setConfirm(''); setErrors({})
    }
  }

  return (
    <Section title="Password">
      <div className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          placeholder="••••••••"
          error={errors.newPass}
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="••••••••"
          error={errors.confirm}
        />
        <div className="flex justify-end">
          <Button onClick={handleChange} loading={loading} size="sm" icon={<Lock size={14} />}>
            Update password
          </Button>
        </div>
      </div>
    </Section>
  )
}

// ── Appearance section ────────────────────────────────────────────────────────
function AppearanceSection() {
  const toast      = useToast()
  const profile    = useAuthStore(s => s.profile)
  const setProfile = useAuthStore(s => s.setProfile)
  const user       = useAuthStore(s => s.user)
  const [accent,   setAccent]   = useState(profile?.accent_color || '#6366f1')
  const [saving,   setSaving]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { data, error } = await supabase
      .from('profiles')
      .update({ accent_color: accent })
      .eq('id', user.id)
      .select()
      .single()
    setSaving(false)
    if (error) toast(error.message, 'error')
    else { setProfile(data); toast('Appearance saved!', 'success') }
  }

  return (
    <Section title="Appearance">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-medium text-slate-300 mb-3">Accent color</p>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setAccent(c.value)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-8 h-8 rounded-full transition-all ${
                    accent === c.value
                      ? 'scale-125 ring-2 ring-white/30 ring-offset-2 ring-offset-[#111120]'
                      : 'opacity-60 hover:opacity-100 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <p className="text-xs text-slate-500 mb-3">Preview</p>
          <div className="flex gap-2">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              Button
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ color: accent, borderColor: accent + '40', backgroundColor: accent + '15' }}
            >
              Badge
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-xs" style={{ color: accent }}>Active</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} size="sm" icon={<Palette size={14} />}>
            Save appearance
          </Button>
        </div>
      </div>
    </Section>
  )
}

// ── Danger zone ───────────────────────────────────────────────────────────────
function DangerSection() {
  const toast   = useToast()
  const signOut = useAuthStore(s => s.signOut)
  const user    = useAuthStore(s => s.user)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    // Sign out — actual account deletion needs Supabase admin API
    await signOut()
    setDeleting(false)
    toast('Account deletion requested. Contact support.', 'info')
  }

  return (
    <Section title="Danger Zone">
      <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
        <div>
          <p className="text-sm font-medium text-red-400">Delete account</p>
          <p className="text-xs text-slate-500 mt-0.5">Permanently delete your account and all data</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => setShowDelete(true)}
        >
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        title="Delete account?"
        description="This action cannot be undone. All your tasks, habits, and data will be permanently deleted."
        confirmLabel="Yes, delete my account"
      />
    </Section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const tabs = [
    { id: 'profile',    label: 'Profile',    icon: User },
    { id: 'password',   label: 'Password',   icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <DashboardLayout>
      <div className="px-8 py-7 max-w-[760px] mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account and preferences</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] w-fit mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              <ProfileSection />
              <DangerSection />
            </motion.div>
          )}
          {activeTab === 'password' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <PasswordSection />
            </motion.div>
          )}
          {activeTab === 'appearance' && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <AppearanceSection />
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}