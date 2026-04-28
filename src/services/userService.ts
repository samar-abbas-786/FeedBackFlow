import api from '../lib/api'
import type { UserResponse } from '../types/api'

export const userService = {
  async getApprovedManagers(): Promise<UserResponse[]> {
    const res = await api.get<UserResponse[]>('/users/managers/approved')
    return res.data
  },
  async getMe(): Promise<UserResponse> {
    const res = await api.get<UserResponse>('/users/me')
    return res.data
  },
}
