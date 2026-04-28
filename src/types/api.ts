export interface AuthResponse {
  token: string
  tokenType: string
  userId: string
  name: string
  email: string
  role: 'MANAGER' | 'EMPLOYEE' | 'ADMIN'
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface UserResponse {
  id: string
  name: string
  email: string
  role: 'MANAGER' | 'EMPLOYEE' | 'ADMIN'
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export interface EmployeeResponse {
  id: string
  name: string
  email: string
  jobTitle: string
  department: string | null
  managerId: string | null
  managerName: string | null
  createdAt: string
}

export interface FeedbackResponse {
  id: string
  employeeId: string
  employeeName: string
  managerId: string
  managerName: string
  period: string
  rawFeedback: string
  strengths: string | null
  improvements: string | null
  overallRating: number
  feedbackTone: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED'
  eqScore: number | null
  createdAt: string
  updatedAt: string
}

export interface FeedbackTransformationResponse {
  id: string
  feedbackId: string
  interpretation: string
  strengthsAffirmation: string
  growthOpportunities: string
  createdAt: string
}

export interface ActionTaskResponse {
  id: string
  actionPlanId: string
  description: string
  completed: boolean
  completedAt: string | null
}

export interface ActionPlanResponse {
  id: string
  feedbackId: string
  dayMilestone: number
  tasks: ActionTaskResponse[]
  completedTasks: number
  totalTasks: number
  createdAt: string
}

export interface LearningResourceResponse {
  id: string
  feedbackId: string
  title: string
  resourceType: string
  provider: string
  url: string
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  last: boolean
}

export interface DashboardManagerResponse {
  managerId: string
  managerName: string
  totalEmployees: number
  avgEqScore: number
  avgProgress: number
  atRiskCount: number
  completedFeedbackCount: number
  topSkillGaps: Array<{ skill: string; count: number }>
  teamMembers: EmployeeResponse[]
}

export interface DashboardEmployeeResponse {
  employeeId: string
  employeeName: string
  overallProgress: number
  latestEqScore: number | null
  latestRating: number | null
  streakDays: number
  activePeriod: string | null
  actionPlans: ActionPlanResponse[]
}

export interface ManagerJoinRequestResponse {
  id: string
  employeeUserId: string
  employeeName: string
  employeeEmail: string
  managerId: string
  managerName: string
  jobTitle: string
  department: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}