import { useState, useEffect, useCallback } from 'react'
import { Shield, CheckCircle, XCircle, Clock, Users, RefreshCw, AlertCircle, Mail, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { adminService } from '../services/adminService'
import type { UserResponse, EmployeeResponse } from '../types/api'
import type { Page } from '../App'

interface Props { onNavigate: (page: Page) => void }

export default function AdminDashboard({ onNavigate }: Props) {
  void onNavigate
  const [pendingManagers, setPendingManagers] = useState<UserResponse[]>([])
  const [allManagers, setAllManagers] = useState<UserResponse[]>([])
  const [allEmployees, setAllEmployees] = useState<EmployeeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'managers' | 'employees'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Email modal
  type EmailTarget = { type: 'manager'; item: UserResponse } | { type: 'employee'; item: EmployeeResponse }
  const [emailModal, setEmailModal] = useState<EmailTarget | null>(null)
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' })
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pending, all, employees] = await Promise.all([
        adminService.getPendingManagers(),
        adminService.getAllManagers(),
        adminService.getAllEmployees(),
      ])
      setPendingManagers(pending)
      setAllManagers(all)
      setAllEmployees(employees)
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try { await adminService.approveManager(id); await loadData() }
    catch { setError('Failed to approve manager.') }
    finally { setActionLoading(null) }
  }

  const handleReject = async (id: string) => {
    setActionLoading(id)
    try { await adminService.rejectManager(id); await loadData() }
    catch { setError('Failed to reject manager.') }
    finally { setActionLoading(null) }
  }

  const handleDeleteManager = async (id: string, name: string) => {
    if (!window.confirm(`Delete manager "${name}" permanently? This cannot be undone.`)) return
    setActionLoading(id)
    try { await adminService.deleteManager(id); await loadData() }
    catch { setError('Failed to delete manager.') }
    finally { setActionLoading(null) }
  }

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!window.confirm(`Delete employee "${name}" permanently? This cannot be undone.`)) return
    setActionLoading(id)
    try { await adminService.deleteEmployee(id); await loadData() }
    catch { setError('Failed to delete employee.') }
    finally { setActionLoading(null) }
  }

  const openEmailModal = (target: EmailTarget) => {
    setEmailModal(target)
    setEmailForm({ subject: '', message: '' })
    setEmailSuccess(false)
    setEmailError('')
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailModal) return
    setEmailLoading(true)
    setEmailError('')
    try {
      if (emailModal.type === 'manager') {
        await adminService.emailManager(emailModal.item.id, emailForm.subject, emailForm.message)
      } else {
        await adminService.emailEmployee(emailModal.item.id, emailForm.subject, emailForm.message)
      }
      setEmailSuccess(true)
    } catch {
      setEmailError('Failed to send email. Please check email configuration.')
    } finally {
      setEmailLoading(false)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'APPROVED') return <Badge variant="success">Approved</Badge>
    if (status === 'REJECTED') return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="warning">Pending</Badge>
  }

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading admin dashboard...</p>
      </div>
    </div>
  )

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-13">Manage users and system oversight</p>
        </div>
        <Button size="sm" variant="secondary" onClick={loadData}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Managers', value: allManagers.length, icon: Users, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950' },
          { label: 'Pending Approval', value: pendingManagers.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
          { label: 'Approved Managers', value: allManagers.filter(m => m.approvalStatus === 'APPROVED').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Total Employees', value: allEmployees.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
        ].map(s => (
          <Card key={s.label} className="!p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {pendingManagers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{pendingManagers.length} manager{pendingManagers.length > 1 ? 's are' : ' is'} waiting for approval.</strong>
          </p>
          <Button size="sm" className="ml-auto" onClick={() => setActiveTab('pending')}>Review</Button>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1 mb-6">
        {[
          { id: 'pending' as const, label: `Pending (${pendingManagers.length})`, icon: Clock },
          { id: 'managers' as const, label: `Managers (${allManagers.length})`, icon: Shield },
          { id: 'employees' as const, label: `Employees (${allEmployees.length})`, icon: Users },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
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

      {activeTab === 'pending' && (
        <div className="space-y-4 animate-slide-up">
          {pendingManagers.length === 0 ? (
            <Card className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No pending manager approvals. All caught up!</p>
            </Card>
          ) : (
            pendingManagers.map(m => (
              <Card key={m.id} className="!p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{m.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{m.email} · Joined {new Date(m.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={() => handleApprove(m.id)} loading={actionLoading === m.id}
                      className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReject(m.id)} loading={actionLoading === m.id}
                      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'managers' && (
        <div className="animate-slide-up">
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {allManagers.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No managers registered yet.</td></tr>
                  ) : (
                    allManagers.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            {m.name}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{m.email}</td>
                        <td className="px-5 py-3">{statusBadge(m.approvalStatus)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2 flex-wrap">
                            {m.approvalStatus !== 'APPROVED' && (
                              <Button size="sm" onClick={() => handleApprove(m.id)} loading={actionLoading === m.id}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs">Approve</Button>
                            )}
                            {m.approvalStatus !== 'REJECTED' && (
                              <Button size="sm" variant="secondary" onClick={() => handleReject(m.id)} loading={actionLoading === m.id}
                                className="text-amber-600 dark:text-amber-400 text-xs">Reject</Button>
                            )}
                            <Button size="sm" variant="secondary" onClick={() => openEmailModal({ type: 'manager', item: m })}>
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDeleteManager(m.id, m.name)} loading={actionLoading === m.id}
                              className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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

      {activeTab === 'employees' && (
        <div className="animate-slide-up">
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Job Title</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Manager</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {allEmployees.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No employees registered yet.</td></tr>
                  ) : (
                    allEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            {emp.name}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{emp.email}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{emp.jobTitle}{emp.department ? ` · ${emp.department}` : ''}</td>
                        <td className="px-5 py-3">
                          {emp.managerName
                            ? <Badge variant="info">{emp.managerName}</Badge>
                            : <Badge variant="default">Unassigned</Badge>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openEmailModal({ type: 'employee', item: emp })}>
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDeleteEmployee(emp.id, emp.name)} loading={actionLoading === emp.id}
                              className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                To: <strong>{emailModal.item.name}</strong> ({emailModal.item.email})
                {' '}<Badge variant={emailModal.type === 'manager' ? 'info' : 'default'}>{emailModal.type}</Badge>
              </p>
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
