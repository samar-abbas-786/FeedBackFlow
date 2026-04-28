import { useState } from 'react'
import { Zap, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import type { Page } from '../App'

interface Props { onNavigate: (page: Page) => void }

type Mode = 'login' | 'register'
type Role = 'MANAGER' | 'EMPLOYEE'

export default function LoginPage({ onNavigate }: Props) {
  const { login } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' as Role })
  const update = (key: keyof typeof form, value: string) => setForm(p => ({ ...p, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPendingApproval(false)
    setLoading(true)
    try {
      let data
      if (mode === 'login') {
        data = await authService.login(form.email, form.password)
      } else {
        data = await authService.register(form.name, form.email, form.password, form.role)
      }

      // Manager just registered → pending approval, don't log them in yet
      if (mode === 'register' && data.role === 'MANAGER' && data.approvalStatus === 'PENDING') {
        setPendingApproval(true)
        return
      }

      login(data)
      if (data.role === 'ADMIN') {
        onNavigate('admin-dashboard')
      } else if (data.role === 'MANAGER') {
        onNavigate('manager-dashboard')
      } else {
        onNavigate('employee-dashboard')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (pendingApproval) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-brand-950">
        <Card className="w-full max-w-md animate-slide-up text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Registration Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Your Manager account has been created and is <strong>pending admin approval</strong>. You will be able to log in once an admin approves your account.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">What happens next:</p>
            {['Admin reviews your registration', 'You receive approval notification', 'Log in and access your manager dashboard', 'Start adding employees and submitting feedback'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-1">
                <Clock className="w-3 h-3 flex-shrink-0" /> {item}
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={() => { setPendingApproval(false); setMode('login'); setForm(p => ({ ...p, password: '' })) }}>
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-brand-950">
      <Card className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {mode === 'login' ? 'Sign in to FeedbackFlow' : 'Join FeedbackFlow today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="John Smith"
                required
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {(['EMPLOYEE', 'MANAGER'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update('role', r)}
                    className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.role === r
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {r === 'EMPLOYEE' ? '👤 Employee' : '👔 Manager'}
                  </button>
                ))}
              </div>
              {form.role === 'MANAGER' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Manager accounts require admin approval before access is granted.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </Card>
    </div>
  )
}
