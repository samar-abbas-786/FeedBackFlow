import api from '../lib/api'
import type { DashboardManagerResponse, DashboardEmployeeResponse } from '../types/api'

export const dashboardService = {
  async getManagerDashboard(managerId: string): Promise<DashboardManagerResponse> {
    const res = await api.get<DashboardManagerResponse>(`/dashboard/manager/${managerId}`)
    return res.data
  },
  async getEmployeeDashboard(employeeId: string): Promise<DashboardEmployeeResponse> {
    const res = await api.get<DashboardEmployeeResponse>(`/dashboard/employee/${employeeId}`)
    return res.data
  },
}
