import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sun, Moon, Zap, Menu, X, LogOut, LogIn, Shield, Users, MessageSquare } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import type { Page } from '../App'

interface LayoutProps {
  children: ReactNode
  currentPage: Page
  onNavigate: (page: Page) => void
}

const publicLinks: { label: string; page: Page }[] = [
  { label: 'Home', page: 'landing' },
]

const adminLinks: { label: string; page: Page }[] = [
  { label: 'Home', page: 'landing' },
  { label: 'Admin Panel', page: 'admin-dashboard' },
]

const managerLinks: { label: string; page: Page }[] = [
  { label: 'Home', page: 'landing' },
  { label: 'My Dashboard', page: 'manager-dashboard' },
  { label: 'Submit Feedback', page: 'feedback-form' },
]

const employeeLinks: { label: string; page: Page }[] = [
  { label: 'Home', page: 'landing' },
  { label: 'My Dashboard', page: 'employee-dashboard' },
]

export const Layout = ({ children, currentPage, onNavigate }: LayoutProps) => {
  const { isDark, toggle } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = !isAuthenticated
    ? publicLinks
    : user?.role === 'ADMIN'
      ? adminLinks
      : user?.role === 'MANAGER'
        ? managerLinks
        : employeeLinks

  const roleIcon = user?.role === 'ADMIN' ? Shield : user?.role === 'MANAGER' ? Users : MessageSquare

  const handleLogout = () => {
    logout()
    onNavigate('landing')
    setMenuOpen(false)
  }

  const RoleIcon = roleIcon

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md group-hover:shadow-brand-500/30 transition-shadow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                FeedbackFlow
              </span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <button
                  key={link.page}
                  onClick={() => onNavigate(link.page)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === link.page
                      ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-24 truncate">{user?.name}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <RoleIcon className="w-3 h-3" />
                      {user?.role}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onNavigate('login')}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
              )}

              <button
                onClick={() => setMenuOpen(v => !v)}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-1 bg-white dark:bg-gray-900">
            {navLinks.map(link => (
              <button
                key={link.page}
                onClick={() => { onNavigate(link.page); setMenuOpen(false) }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === link.page
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </button>
            ))}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout ({user?.name})
              </button>
            ) : (
              <button
                onClick={() => { onNavigate('login'); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      <main className="flex-1 animate-fade-in">{children}</main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">FeedbackFlow</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © 2025 FeedbackFlow. Empowering growth through clarity.
          </p>
        </div>
      </footer>
    </div>
  )
}
