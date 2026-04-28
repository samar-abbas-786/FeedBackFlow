import { useState, useCallback, useEffect } from 'react'
import { Users, TrendingUp, AlertTriangle, BarChart3, MessageSquare, Award, ArrowUpRight, RefreshCw, AlertCircle, Plus, CheckCircle, XCircle, Clock, UserPlus, Mail, UserMinus } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import { dashboardService } from '../services/dashboardService'
import { feedbackService } from '../services/feedbackService'
import { employeeService } from '../services/employeeService'
import { joinRequestService } from '../services/joinRequestService'
import { emailService } from '../services/emailService'
import { useAuth } from '../context/AuthContext'
import type { DashboardManagerResponse, EmployeeResponse, FeedbackResponse, PageResponse, ManagerJoinRequestResponse } from '../types/api'
import type { Page } from '../App'

interface Props { onNavigate: (page: Page) => void }

export default function ManagerDashboard({ onNavigate }: Props) {
  const { user } = useAuth()
  const managerId = user?.userId

  const [data, setData] = useState<DashboardManagerResponse | null>(null)
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackResponse[]>([])
  const [joinRequests, setJoinRequests] = useState<ManagerJoinRequestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'team' | 'analytics' | 'history' | 'requests' | 'add-employee'>('team')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Email modal state
  const [emailModal, setEmailModal] = useState<{ employee: EmployeeResponse } | null>(null)
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' })
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Add Employee form state
  const [addForm, setAddForm] = useState({ name: '', email: '', jobTitle: '', department: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!managerId) return
    setLoading(true)
    setError('')
    try {
      const [dashboard, feedbackPage, requests] = await Promise.all([
        dashboardService.getManagerDashboard(managerId),
        feedbackService.getByManager(managerId, 0, 20) as Promise<PageResponse<FeedbackResponse>>,
        joinRequestService.getPendingByManager(managerId),
      ])
      setData(dashboard)
      setFeedbackHistory(feedbackPage.content)
      setJoinRequests(requests)
    } catch {
      setError('Failed to load dashboard data.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [managerId])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const handleApproveRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      await joinRequestService.approveRequest(requestId)
      await loadDashboard()
    } catch {
      setError('Failed to approve request.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      await joinRequestService.rejectRequest(requestId)
      setJoinRequests(prev => prev.filter(r => r.id !== requestId))
    } catch {
      setError('Failed to reject request.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!window.confirm('Remove this employee from your team? They will need to re-submit a join request.')) return
    setActionLoading(employeeId)
    try {
      await employeeService.removeFromTeam(employeeId)
      await loadDashboard()
    } catch {
      setError('Failed to remove employee.')
    } finally {
      setActionLoading(null)
    }
  }

  const openEmailModal = (employee: EmployeeResponse) => {
    setEmailModal({ employee })
    setEmailForm({ subject: '', message: '' })
    setEmailSuccess(false)
    setEmailError('')
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managerId || !emailModal) return
    setEmailLoading(true)
    setEmailError('')
    try {
      await emailService.managerEmailEmployee(managerId, emailModal.employee.id, emailForm.subject, emailForm.message)
      setEmailSuccess(true)
    } catch {
      setEmailError('Failed to send email. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managerId) return
    setAddError('')
    setAddLoading(true)
    try {
      await employeeService.create({
        name: addForm.name,
        email: addForm.email,
        jobTitle: addForm.jobTitle,
        department: addForm.department || undefined,
        managerId,
      })
      setAddSuccess(true)
      setAddForm({ name: '', email: '', jobTitle: '', department: '' })
      await loadDashboard()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setAddError(axiosErr?.response?.data?.message || 'Failed to add employee.')
    } finally {
      setAddLoading(false)
    }
  }

  const tabs = [
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'requests' as const, label: `Requests${joinRequests.length > 0 ? ` (${joinRequests.length})` : ''}`, icon: UserPlus },
    { id: 'add-employee' as const, label: 'Add Employee', icon: Plus },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'history' as const, label: 'Feedback History', icon: MessageSquare },
  ]

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <Button variant="secondary" onClick={loadDashboard}>Retry</Button>
        </Card>
      </div>
    )
  }

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">{data?.managerName ?? user?.name}'s Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">{data?.totalEmployees ?? 0} team members</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={loadDashboard}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button onClick={() => onNavigate('feedback-form')}>
            <MessageSquare className="w-4 h-4" /> Submit Feedback
          </Button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Team Members', value: String(data.totalEmployees), icon: Users, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
            { label: 'Avg EQ Score', value: String(data.avgEqScore), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950', suffix: '/100' },
            { label: 'Avg Progress', value: `${data.avgProgress}%`, icon: Award, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
            { label: 'Pending Requests', value: String(joinRequests.length), icon: AlertTriangle, color: joinRequests.length > 0 ? 'text-amber-500' : 'text-gray-400', bg: joinRequests.length > 0 ? 'bg-amber-50 dark:bg-amber-950' : 'bg-gray-50 dark:bg-gray-800' },
          ].map(s => (
            <Card key={s.label} className="!p-4">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}{(s as {suffix?: string}).suffix ?? ''}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {joinRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Join Requests Awaiting Approval</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              {joinRequests.length} employee{joinRequests.length > 1 ? 's have' : ' has'} requested to join your team.
            </p>
          </div>
          <Button size="sm" className="ml-auto" onClick={() => setActiveTab('requests')}>Review</Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'team' && (
        <div className="space-y-4 animate-slide-up">
          {!data || data.teamMembers.length === 0 ? (
            <Card className="text-center py-8">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No team members yet.</p>
              <Button size="sm" onClick={() => setActiveTab('add-employee')}>
                <Plus className="w-4 h-4" /> Add First Employee
              </Button>
            </Card>
          ) : (
            data.teamMembers.map(m => (
              <Card key={m.id} hover className="!p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {m.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{m.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{m.jobTitle}{m.department ? ` · ${m.department}` : ''} · {m.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => openEmailModal(m)}>
                      <Mail className="w-4 h-4" /> Email
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onNavigate('feedback-form')}>
                      <ArrowUpRight className="w-4 h-4" /> Feedback
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleRemoveEmployee(m.id)}
                      loading={actionLoading === m.id}
                      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <UserMinus className="w-4 h-4" /> Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4 animate-slide-up">
          {joinRequests.length === 0 ? (
            <Card className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No pending join requests.</p>
            </Card>
          ) : (
            joinRequests.map(req => (
              <Card key={req.id} className="!p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {req.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{req.employeeName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{req.employeeEmail} · {req.jobTitle}{req.department ? ` · ${req.department}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                    <Button size="sm" onClick={() => handleApproveRequest(req.id)} loading={actionLoading === req.id}
                      className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleRejectRequest(req.id)} loading={actionLoading === req.id}
                      className="text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'add-employee' && (
        <div className="animate-slide-up max-w-lg">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
                <Plus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold">Add Employee to Your Team</h2>
            </div>
            {addSuccess && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-xl mb-4">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Employee added successfully!
              </div>
            )}
            {addError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{addError}
              </div>
            )}
            <form onSubmit={handleAddEmployee} className="space-y-4">
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Jane Doe', required: true },
                { key: 'email', label: 'Email Address', placeholder: 'jane@company.com', required: true },
                { key: 'jobTitle', label: 'Job Title', placeholder: 'Software Engineer', required: true },
                { key: 'department', label: 'Department (optional)', placeholder: 'Engineering', required: false },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{field.label}</label>
                  <input
                    type={field.key === 'email' ? 'email' : 'text'}
                    value={(addForm as Record<string, string>)[field.key]}
                    onChange={e => setAddForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              ))}
              <Button type="submit" className="w-full" loading={addLoading}>
                <Plus className="w-4 h-4" /> Add Employee
              </Button>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && data && (
        <div className="space-y-6 animate-slide-up">
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">Top Skill Gaps Across Team</h3>
            {data.topSkillGaps.length === 0 ? (
              <p className="text-sm text-gray-400">No skill gap data yet.</p>
            ) : (
              <div className="space-y-4">
                {data.topSkillGaps.map((g, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{g.skill}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{g.count} member{g.count > 1 ? 's' : ''}</span>
                    </div>
                    <ProgressBar value={Math.min((g.count / Math.max(data.totalEmployees, 1)) * 100, 100)} color={g.count >= 3 ? 'red' : 'amber'} />
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Completed Feedback', value: data.completedFeedbackCount },
                { label: 'Total Employees', value: data.totalEmployees },
                { label: 'Average EQ Score', value: `${data.avgEqScore}/100` },
                { label: 'Average Progress', value: `${data.avgProgress}%` },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="animate-slide-up">
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Employee</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Period</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Tone</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">EQ Score</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {feedbackHistory.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No feedback history yet.</td></tr>
                  ) : (
                    feedbackHistory.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{f.employeeName}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{f.period}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{f.feedbackTone}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${f.eqScore != null && f.eqScore >= 80 ? 'text-green-600 dark:text-green-400' : f.eqScore != null && f.eqScore >= 65 ? 'text-brand-600 dark:text-brand-400' : 'text-red-600 dark:text-red-400'}`}>
                            {f.eqScore ?? 'Processing...'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={f.status === 'COMPLETED' ? 'success' : f.status === 'PROCESSING' ? 'warning' : 'default'}>
                            {f.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>

    {/* Email Modal */}
    {emailModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-md animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Send Email</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">To: <strong>{emailModal.employee.name}</strong> ({emailModal.employee.email})</p>
            </div>
            <button onClick={() => setEmailModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {emailSuccess ? (
            <div className="text-center py-6">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-medium text-gray-900 dark:text-gray-100">Email sent successfully!</p>
              <Button className="mt-4" size="sm" variant="secondary" onClick={() => setEmailModal(null)}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {emailError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{emailError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject *</label>
                <input type="text" required value={emailForm.subject}
                  onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Subject line..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message *</label>
                <textarea required rows={5} value={emailForm.message}
                  onChange={e => setEmailForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Write your message..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setEmailModal(null)}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={emailLoading}>
                  <Mail className="w-4 h-4" /> Send Email
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    )}
    </>
  )
}
