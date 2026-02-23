import { useEffect } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider, PageLoader } from './components/ui'
import { supabase } from './lib/supabase'
import useAuthStore from './store/useAuthStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TasksPage from './pages/Tasks'
import HabitsPage from './pages/Habits'
import PomodoroPage from './pages/Pomodoro'
import SettingsPage from './pages/Settings'
import Landing from './pages/Landing'
import Workspaces from './pages/Workspaces'
import AIChat from './pages/AIChat'

function PrivateRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const P = ({ children }) => <PrivateRoute>{children}</PrivateRoute>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/dashboard" element={<P><Dashboard /></P>} />
        <Route path="/tasks" element={<P><TasksPage /></P>} />
        <Route path="/habits" element={<P><HabitsPage /></P>} />
        <Route path="/pomodoro" element={<P><PomodoroPage /></P>} />
        <Route path="/settings" element={<P><SettingsPage /></P>} />
        <Route path="/workspaces" element={<P><Workspaces /></P>} />
        <Route path="/ai" element={<P><AIChat /></P>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function Root() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  )
}