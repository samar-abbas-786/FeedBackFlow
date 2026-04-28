import { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import {Layout} from './components/Layout'
import LandingPage from './pages/LandingPage'
import FeedbackForm from './pages/FeedbackForm'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'

export type Page = 'landing' | 'login' | 'feedback-form' | 'employee-dashboard' | 'manager-dashboard' | 'admin-dashboard'

function AppContent() {
  const { isAuthenticated, user } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('landing')

  // Auto-redirect authenticated users away from landing/login to their dashboard
  useEffect(() => {
    if (!user) return
    if (currentPage === 'landing' || currentPage === 'login') {
      if (user.role === 'ADMIN') setCurrentPage('admin-dashboard')
      else if (user.role === 'MANAGER') setCurrentPage('manager-dashboard')
      else setCurrentPage('employee-dashboard')
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = (page: Page) => {
    if (!isAuthenticated && (page === 'feedback-form' || page === 'employee-dashboard' || page === 'manager-dashboard' || page === 'admin-dashboard')) {
      setCurrentPage('login')
      return
    }
    setCurrentPage(page)
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
      {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
      {currentPage === 'feedback-form' && <FeedbackForm onNavigate={handleNavigate} />}
      {currentPage === 'employee-dashboard' && <EmployeeDashboard onNavigate={handleNavigate} />}
      {currentPage === 'manager-dashboard' && <ManagerDashboard onNavigate={handleNavigate} />}
      {currentPage === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
