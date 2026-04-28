import api from '../lib/api'
import type { UserResponse, EmployeeResponse } from '../types/api'

export const adminService = {
  async getPendingManagers(): Promise<UserResponse[]> {
    const res = await api.get<UserResponse[]>('/admin/managers/pending')
    return res.data
  },
  async getAllManagers(): Promise<UserResponse[]> {
    const res = await api.get<UserResponse[]>('/admin/managers')
    return res.data
  },
  async getAllEmployees(): Promise<EmployeeResponse[]> {
    const res = await api.get<EmployeeResponse[]>('/admin/employees')
    return res.data
  },
  async approveManager(id: string): Promise<UserResponse> {
    const res = await api.put<UserResponse>(`/admin/managers/${id}/approve`)
    return res.data
  },
  async rejectManager(id: string): Promise<UserResponse> {
    const res = await api.put<UserResponse>(`/admin/managers/${id}/reject`)
    return res.data
  },
  async deleteManager(id: string): Promise<void> {
    await api.delete(`/admin/managers/${id}`)
  },
  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`/admin/employees/${id}`)
  },
  async emailManager(managerId: string, subject: string, message: string): Promise<void> {
    await api.post(`/admin/email/manager/${managerId}`, { subject, message })
  },
  async emailEmployee(employeeId: string, subject: string, message: string): Promise<void> {
    await api.post(`/admin/email/employee/${employeeId}`, { subject, message })
  },
}
