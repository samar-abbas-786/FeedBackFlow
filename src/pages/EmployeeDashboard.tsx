import { useState, useEffect, useCallback } from 'react'
import { Brain, Target, TrendingUp, BookOpen, Award, CheckCircle, Clock, Circle, ChevronRight, Star, Flame, AlertCircle, RefreshCw, UserPlus, Users, History } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import { dashboardService } from '../services/dashboardService'
import { feedbackService } from '../services/feedbackService'
import { taskService } from '../services/taskService'
import { employeeService } from '../services/employeeService'
import { joinRequestService } from '../services/joinRequestService'
import { userService } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import type { DashboardEmployeeResponse, FeedbackResponse, FeedbackTransformationResponse, ActionTaskResponse, LearningResourceResponse, ManagerJoinRequestResponse, UserResponse } from '../types/api'
import type { Page } from '../App'

interface Props { onNavigate: (page: Page) => void }

export default function EmployeeDashboard({ onNavigate: _onNavigate }: Props) {
  const { user } = useAuth()

  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [data, setData] = useState<DashboardEmployeeResponse | null>(null)
  const [transformation, setTransformation] = useState<FeedbackTransformationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'resources' | 'history'>('overview')
  const [activePlan, setActivePlan] = useState<number>(30)
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({})

  // Join request flow
  const [myRequests, setMyRequests] = useState<ManagerJoinRequestResponse[]>([])
  const [approvedManagers, setApprovedManagers] = useState<UserResponse[]>([])
  const [joinForm, setJoinForm] = useState({ managerId: '', jobTitle: '', department: '' })
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState(false)

  // Feedback history
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackResponse[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null)
  const [historyTransformations, setHistoryTransformations] = useState<Record<string, FeedbackTransformationResponse>>({})

  const loadDashboard = useCallback(async (empId: string) => {
    setLoading(true)
    setError('')
    try {
      const dashboard = await dashboardService.getEmployeeDashboard(empId)
      setData(dashboard)

      if (dashboard.actionPlans.length > 0 && dashboard.actionPlans[0].feedbackId) {
        try {
          const t = await feedbackService.getTransformation(dashboard.actionPlans[0].feedbackId)
          setTransformation(t)
        } catch {
          setTransformation(null)
        }
      }

      const states: Record<string, boolean> = {}
      dashboard.actionPlans.forEach(plan =>
        plan.tasks.forEach(task => { states[task.id] = task.completed })
      )
      setTaskStates(states)
    } catch {
      setError('No feedback available yet. Ask your manager to submit feedback for you.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async (empId: string) => {
    setHistoryLoading(true)
    try {
      const result = await feedbackService.getByEmployee(empId, 0, 50)
      setFeedbackHistory(result.content)
    } catch {
      setFeedbackHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const handleExpandFeedback = async (feedbackId: string) => {
    if (expandedFeedbackId === feedbackId) { setExpandedFeedbackId(null); return }
    setExpandedFeedbackId(feedbackId)
    if (!historyTransformations[feedbackId]) {
      try {
        const t = await feedbackService.getTransformation(feedbackId)
        setHistoryTransformations(prev => ({ ...prev, [feedbackId]: t }))
      } catch { /* transformation not ready yet */ }
    }
  }

  // On mount: find employee profile linked to this user account
  useEffect(() => {
    if (!user) return
    const init = async () => {
      setLoading(true)
      try {
        const emp = await employeeService.getByUserId(user.userId)
        if (emp) {
          setEmployeeId(emp.id)
          await loadDashboard(emp.id)
          loadHistory(emp.id)
        } else {
          // No employee profile yet — load join request data
          const [requests, managers] = await Promise.all([
            joinRequestService.getMyRequests(user.userId),
            userService.getApprovedManagers(),
          ])
          setMyRequests(requests)
          setApprovedManagers(managers)
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }
    init()
  }, [user, loadDashboard, loadHistory])

  const handleToggleTask = async (task: ActionTaskResponse) => {
    const newCompleted = !taskStates[task.id]
    setTaskStates(prev => ({ ...prev, [task.id]: newCompleted }))
    try {
      if (newCompleted) {
        await taskService.markComplete(task.id)
      } else {
        await taskService.markIncomplete(task.id)
      }
    } catch {
      setTaskStates(prev => ({ ...prev, [task.id]: !newCompleted }))
    }
  }

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !joinForm.managerId) return
    setJoinError('')
    setJoinLoading(true)
    try {
      const req = await joinRequestService.createRequest(user.userId, {
        managerId: joinForm.managerId,
        jobTitle: joinForm.jobTitle,
        department: joinForm.department || undefined,
      })
      setMyRequests(prev => [...prev, req])
      setJoinSuccess(true)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setJoinError(axiosErr?.response?.data?.message || 'Failed to submit request.')
    } finally {
      setJoinLoading(false)
    }
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Brain },
    { id: 'plan' as const, label: 'Action Plan', icon: Target },
    { id: 'resources' as const, label: 'Resources', icon: BookOpen },
    { id: 'history' as const, label: 'History', icon: History },
  ]

  const activePlanData = data?.actionPlans.find(p => p.dayMilestone === activePlan)

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Employee has no profile yet — show join request flow
  if (!employeeId) {
    const pendingRequest = myRequests.find(r => r.status === 'PENDING')
    const approvedRequest = myRequests.find(r => r.status === 'APPROVED')

    if (approvedRequest) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <Card className="max-w-md w-full text-center animate-slide-up">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Request Approved!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You've been added to <strong>{approvedRequest.managerName}'s</strong> team. Refreshing your profile...
            </p>
            <Button onClick={() => window.location.reload()}>Refresh Dashboard</Button>
          </Card>
        </div>
      )
    }

    if (pendingRequest) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <Card className="max-w-md w-full text-center animate-slide-up">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Request Pending</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your request to join <strong>{pendingRequest.managerName}'s</strong> team is awaiting their approval.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left mb-4">
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <span className="font-medium">Job Title:</span> {pendingRequest.jobTitle}
              </div>
              {pendingRequest.department && (
                <div className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  <span className="font-medium">Department:</span> {pendingRequest.department}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">You'll be notified once the manager approves your request.</p>
          </Card>
        </div>
      )
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Join a Manager's Team</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To access your feedback dashboard, request to join a manager's team. They'll approve your request and set you up.
            </p>
          </div>

          {joinSuccess ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">Request submitted!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Waiting for manager approval.</p>
            </div>
          ) : (
            <>
              {approvedManagers.length === 0 ? (
                <div className="text-center py-4 text-amber-600 dark:text-amber-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No approved managers available yet. Check back later.
                </div>
              ) : (
                <form onSubmit={handleJoinRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select a Manager *</label>
                    <select
                      value={joinForm.managerId}
                      onChange={e => setJoinForm(p => ({ ...p, managerId: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="">— Select a manager —</option>
                      {approvedManagers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your Job Title *</label>
                    <input
                      type="text"
                      value={joinForm.jobTitle}
                      onChange={e => setJoinForm(p => ({ ...p, jobTitle: e.target.value }))}
                      placeholder="Software Engineer"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department (optional)</label>
                    <input
                      type="text"
                      value={joinForm.department}
                      onChange={e => setJoinForm(p => ({ ...p, department: e.target.value }))}
                      placeholder="Engineering"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  {joinError && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{joinError}
                    </div>
                  )}
                  <Button type="submit" className="w-full" loading={joinLoading}>
                    <UserPlus className="w-4 h-4" /> Request to Join
                  </Button>
                </form>
              )}
            </>
          )}
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error || 'No feedback available yet.'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ask your manager to submit feedback for you to see your development plan.</p>
        </Card>
      </div>
    )
  }

  const day30Plan = data.actionPlans.find(p => p.dayMilestone === 30)
  const day30Pct = day30Plan ? Math.round((day30Plan.completedTasks / Math.max(day30Plan.totalTasks, 1)) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{data.employeeName}</h1>
            {data.activePeriod && <Badge variant="info">{data.activePeriod}</Badge>}
          </div>
          <p className="text-gray-500 dark:text-gray-400">Your development dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {data.streakDays > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-200 dark:border-amber-800">
              <Flame className="w-3.5 h-3.5" />
              {data.streakDays}-day streak
            </div>
          )}
          <Button size="sm" variant="secondary" onClick={() => loadDashboard(employeeId)}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Overall Progress', value: `${data.overallProgress}%`, icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
          { label: 'EQ Score', value: data.latestEqScore != null ? `${data.latestEqScore}/100` : 'N/A', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'Manager Rating', value: data.latestRating != null ? `${data.latestRating}/5` : 'N/A', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
          { label: '30-Day Complete', value: `${day30Pct}%`, icon: Award, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
        ].map(s => (
          <Card key={s.label} className="!p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-slide-up">
          {transformation && (
            <Card>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">AI Interpretation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{transformation.interpretation}</p>
                </div>
              </div>
            </Card>
          )}

          {transformation && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Your Strengths
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{transformation.strengthsAffirmation}</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-500" /> Growth Opportunities
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{transformation.growthOpportunities}</p>
              </Card>
            </div>
          )}

          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">Overall Progress</h3>
            <div className="space-y-4">
              <ProgressBar value={data.overallProgress} label="Overall Plan Completion" color="brand" />
              {data.actionPlans.map(plan => (
                <ProgressBar
                  key={plan.id}
                  value={plan.totalTasks > 0 ? Math.round((plan.completedTasks / plan.totalTasks) * 100) : 0}
                  label={`${plan.dayMilestone}-Day Milestones`}
                  color={plan.dayMilestone === 30 ? 'green' : plan.dayMilestone === 60 ? 'brand' : 'amber'}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="animate-slide-up">
          <div className="flex gap-2 mb-6">
            {data.actionPlans.map(plan => (
              <button key={plan.id} onClick={() => setActivePlan(plan.dayMilestone)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  activePlan === plan.dayMilestone
                    ? 'border-brand-500 bg-brand-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'
                }`}
              >
                {plan.dayMilestone}-Day
              </button>
            ))}
          </div>
          {activePlanData && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">
                {activePlanData.dayMilestone}-Day Action Items
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({activePlanData.tasks.filter(t => taskStates[t.id] ?? t.completed).length}/{activePlanData.totalTasks} completed)
                </span>
              </h3>
              <div className="space-y-3">
                {activePlanData.tasks.map(task => {
                  const done = taskStates[task.id] ?? task.completed
                  return (
                    <div key={task.id} onClick={() => handleToggleTask(task)} style={{ cursor: 'pointer' }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                        done
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-brand-300'
                      }`}
                    >
                      {done
                        ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        : <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                      }
                      <span className={`text-sm leading-relaxed flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {task.description}
                      </span>
                      {!done && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'resources' && (
        <ResourcesTab feedbackId={data.actionPlans[0]?.feedbackId} />
      )}

      {activeTab === 'history' && (
        <div className="animate-slide-up space-y-4">
          {historyLoading ? (
            <div className="text-center py-10 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading feedback history...</p>
            </div>
          ) : feedbackHistory.length === 0 ? (
            <Card className="text-center py-8">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No feedback history yet.</p>
            </Card>
          ) : (
            feedbackHistory.map(fb => {
              const isExpanded = expandedFeedbackId === fb.id
              const trans = historyTransformations[fb.id]
              const statusVariant = fb.status === 'COMPLETED' ? 'success' : fb.status === 'PROCESSING' ? 'warning' : 'default'
              return (
                <Card key={fb.id} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{fb.period}</span>
                        <Badge variant={statusVariant}>{fb.status}</Badge>
                        <Badge variant="default">{fb.feedbackTone}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>By {fb.managerName}</span>
                        <span>·</span>
                        <span>{new Date(fb.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {fb.eqScore != null && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Brain className="w-3.5 h-3.5 text-purple-500" /> EQ {fb.eqScore}/100
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= fb.overallRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                      {fb.status === 'COMPLETED' && (
                        <Button size="sm" variant="secondary" onClick={() => handleExpandFeedback(fb.id)}>
                          {isExpanded ? 'Hide' : 'View AI Analysis'}
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {fb.rawFeedback && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Feedback:</span>
                      {fb.rawFeedback.length > 220 ? fb.rawFeedback.slice(0, 220) + '…' : fb.rawFeedback}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                      {trans ? (
                        <>
                          <div className="bg-brand-50 dark:bg-brand-950/50 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-brand-700 dark:text-brand-400 mb-2 flex items-center gap-2">
                              <Brain className="w-4 h-4" /> AI Interpretation
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{trans.interpretation}</p>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Your Strengths
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{trans.strengthsAffirmation}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Growth Areas
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{trans.growthOpportunities}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-400">
                          <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                          Loading analysis...
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function ResourcesTab({ feedbackId }: { feedbackId?: string }) {
  const [resources, setResources] = useState<LearningResourceResponse[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!feedbackId) return
    setLoading(true)
    feedbackService.getResources(feedbackId)
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setLoading(false))
  }, [feedbackId])

  if (loading) return <div className="text-center py-10 text-gray-400">Loading resources...</div>
  if (!resources.length) return (
    <Card className="text-center py-8">
      <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">No resources yet. Your manager needs to submit feedback first.</p>
    </Card>
  )

  return (
    <div className="space-y-4 animate-slide-up">
      {resources.map(r => (
        <Card key={r.id} hover className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{r.title}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{r.resourceType}</Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{r.provider}</span>
                </div>
              </div>
              {r.url && r.url !== '#' && (
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="ghost">Open <ChevronRight className="w-3.5 h-3.5" /></Button>
                </a>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}