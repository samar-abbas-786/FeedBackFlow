import api from '../lib/api'
import type { ActionTaskResponse } from '../types/api'

export const taskService = {
  async markComplete(taskId: string): Promise<ActionTaskResponse> {
    const res = await api.patch<ActionTaskResponse>(`/action-tasks/${taskId}/complete`)
    return res.data
  },
  async markIncomplete(taskId: string): Promise<ActionTaskResponse> {
    const res = await api.patch<ActionTaskResponse>(`/action-tasks/${taskId}/incomplete`)
    return res.data
  },
}
