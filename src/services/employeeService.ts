import api from '../lib/api'
import type { EmployeeResponse, PageResponse } from '../types/api'

export const employeeService = {
  async getAll(page = 0, size = 50): Promise<PageResponse<EmployeeResponse>> {
    const res = await api.get<PageResponse<EmployeeResponse>>('/employees', { params: { page, size } })
    return res.data
  },
  async getByManager(managerId: string, page = 0, size = 50): Promise<PageResponse<EmployeeResponse>> {
    const res = await api.get<PageResponse<EmployeeResponse>>(`/employees/manager/${managerId}`, { params: { page, size } })
    return res.data
  },
  async getByUserId(userId: string): Promise<EmployeeResponse | null> {
    try {
      const res = await api.get<EmployeeResponse>(`/employees/by-user/${userId}`)
      if (res.status === 204 || !res.data) return null
      return res.data
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr?.response?.status === 204 || axiosErr?.response?.status === 404) return null
      throw err
    }
  },
  async create(data: { name: string; email: string; jobTitle: string; department?: string; managerId?: string }): Promise<EmployeeResponse> {
    const res = await api.post<EmployeeResponse>('/employees', data)
    return res.data
  },
  async removeFromTeam(employeeId: string): Promise<EmployeeResponse> {
    const res = await api.patch<EmployeeResponse>(`/employees/${employeeId}/remove-manager`)
    return res.data
  },
}

