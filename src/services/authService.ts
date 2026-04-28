import api from '../lib/api'
import type { AuthResponse } from '../types/api'

export const authService = {
  async register(name: string, email: string, password: string, role: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password, role })
    return res.data
  },
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password })
    return res.data
  },
}
