import api from '../lib/api'

export const emailService = {
  async managerEmailEmployee(managerId: string, employeeId: string, subject: string, message: string): Promise<void> {
    await api.post(`/manager/${managerId}/email-employee/${employeeId}`, { subject, message })
  },
}
