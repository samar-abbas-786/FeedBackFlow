import api from '../lib/api'
import type { ManagerJoinRequestResponse } from '../types/api'

export const joinRequestService = {
  async createRequest(
    employeeUserId: string,
    data: { managerId: string; jobTitle: string; department?: string }
  ): Promise<ManagerJoinRequestResponse> {
    const res = await api.post<ManagerJoinRequestResponse>(`/join-requests/employee/${employeeUserId}`, data)
    return res.data
  },

  async getPendingByManager(managerId: string): Promise<ManagerJoinRequestResponse[]> {
    const res = await api.get<ManagerJoinRequestResponse[]>(`/join-requests/manager/${managerId}/pending`)
    return res.data
  },

  async getMyRequests(employeeUserId: string): Promise<ManagerJoinRequestResponse[]> {
    const res = await api.get<ManagerJoinRequestResponse[]>(`/join-requests/employee/${employeeUserId}/my-requests`)
    return res.data
  },

  async approveRequest(requestId: string): Promise<ManagerJoinRequestResponse> {
    const res = await api.put<ManagerJoinRequestResponse>(`/join-requests/${requestId}/approve`)
    return res.data
  },

  async rejectRequest(requestId: string): Promise<ManagerJoinRequestResponse> {
    const res = await api.put<ManagerJoinRequestResponse>(`/join-requests/${requestId}/reject`)
    return res.data
  },
}
