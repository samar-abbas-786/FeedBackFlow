import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import type { AuthResponse } from '../types/api'

interface AuthUser {
  userId: string
  name: string
  email: string
  role: 'MANAGER' | 'EMPLOYEE' | 'ADMIN'
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  token: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (data: AuthResponse) => void
  logout: () => void
  isAuthenticated: boolean
}

const authFallback: AuthContextType = {
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  // ✅ Safe hydration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ff_user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      setUser(null)
    }
  }, [])

  const login = (data: AuthResponse) => {
    const authUser: AuthUser = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      approvalStatus: data.approvalStatus,
      token: data.token,
    }

    localStorage.setItem('ff_token', data.token)
    localStorage.setItem('ff_user', JSON.stringify(authUser))
    setUser(authUser)
  }

  const logout = () => {
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  return context ?? authFallback
}