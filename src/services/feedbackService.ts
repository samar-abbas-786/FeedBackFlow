import api from '../lib/api'
import type {
  FeedbackResponse, FeedbackTransformationResponse,
  ActionPlanResponse, LearningResourceResponse, PageResponse
} from '../types/api'

export const feedbackService = {
  async submit(data: {
    employeeId: string
    managerId: string
    period: string
    rawFeedback: string
    strengths?: string
    improvements?: string
    overallRating: number
    feedbackTone: string
  }): Promise<FeedbackResponse> {
    const res = await api.post<FeedbackResponse>('/feedback', data)
    return res.data
  },
  async getById(id: string): Promise<FeedbackResponse> {
    const res = await api.get<FeedbackResponse>(`/feedback/${id}`)
    return res.data
  },
  async getByEmployee(employeeId: string, page = 0, size = 10): Promise<PageResponse<FeedbackResponse>> {
    const res = await api.get<PageResponse<FeedbackResponse>>(`/feedback/employee/${employeeId}`, { params: { page, size } })
    return res.data
  },
  async getByManager(managerId: string, page = 0, size = 20): Promise<PageResponse<FeedbackResponse>> {
    const res = await api.get<PageResponse<FeedbackResponse>>(`/feedback/manager/${managerId}`, { params: { page, size } })
    return res.data
  },
  async getTransformation(feedbackId: string): Promise<FeedbackTransformationResponse> {
    const res = await api.get<FeedbackTransformationResponse>(`/feedback/${feedbackId}/transformation`)
    return res.data
  },
  async getActionPlans(feedbackId: string): Promise<ActionPlanResponse[]> {
    const res = await api.get<ActionPlanResponse[]>(`/feedback/${feedbackId}/action-plans`)
    return res.data
  },
  async getResources(feedbackId: string): Promise<LearningResourceResponse[]> {
    const res = await api.get<LearningResourceResponse[]>(`/feedback/${feedbackId}/resources`)
    return res.data
  },
}
