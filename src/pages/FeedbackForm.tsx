import { useState, useEffect } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, User, MessageSquare, Star, Lightbulb, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { employeeService } from '../services/employeeService'
import { feedbackService } from '../services/feedbackService'
import type { EmployeeResponse, FeedbackResponse } from '../types/api'
import type { Page } from '../App'

interface Props { onNavigate: (page: Page) => void }

interface EmployeeOption {
  id: string
  name: string
  jobTitle: string
  department: string | null
}

interface FormData {
  employeeId: string | null
  reviewPeriod: string
  overallRating: number
  strengths: string
  improvements: string
  rawFeedback: string
  feedbackTone: string
  template: string
}

const templates = [
  { id: 'communication', label: 'Communication Gap', preview: 'Needs to improve clarity and frequency of updates...' },
  { id: 'technical', label: 'Technical Growth', preview: 'Shows potential but needs deeper expertise in...' },
  { id: 'leadership', label: 'Leadership Development', preview: 'Ready to take on more responsibility, should focus on...' },
  { id: 'performance', label: 'Performance Review', preview: 'Overall performance this quarter has been...' },
  { id: 'custom', label: 'Custom Feedback', preview: 'Write your own feedback from scratch' },
]

const toneOptions = ['FORMAL', 'CONSTRUCTIVE', 'ENCOURAGING', 'NEUTRAL', 'DEVELOPMENTAL']
const toneLabels: Record<string, string> = {
  FORMAL: 'Formal', CONSTRUCTIVE: 'Constructive', ENCOURAGING: 'Encouraging',
  NEUTRAL: 'Neutral', DEVELOPMENTAL: 'Developmental',
}

const initialForm: FormData = {
  employeeId: null,
  reviewPeriod: 'Q1 2025',
  overallRating: 0,
  strengths: '',
  improvements: '',
  rawFeedback: '',
  feedbackTone: 'CONSTRUCTIVE',
  template: 'custom',
}

export default function FeedbackForm({ onNavigate }: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackResponse | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormData>(initialForm)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const normalizeId = (value: unknown): string => String(value ?? '').trim()

  const isInvalidId = (value: string): boolean => !value || ['undefined', 'null', 'nan'].includes(value.toLowerCase())

  useEffect(() => {
    if (!user || user.role !== 'MANAGER') return
    const fetchEmployees = async () => {
      setLoadingEmployees(true)
      try {
        const res = await employeeService.getByManager(user.userId)
        const normalized = (res.content as Array<EmployeeResponse & { _id?: string; employeeId?: string | number }>).
          map(emp => ({
            id: normalizeId(emp.id ?? emp._id ?? emp.employeeId),
            name: emp.name,
            jobTitle: emp.jobTitle,
            department: emp.department ?? null,
          }))
          .filter(emp => !isInvalidId(emp.id))
        setEmployees(normalized)
      } catch {
        setEmployees([])
      } finally {
        setLoadingEmployees(false)
      }
    }

    fetchEmployees()
  }, [user])

  const update = (key: keyof FormData, value: string | number | null) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const selectedEmployee = employees.find(e => e.id === form.employeeId)

  const handleSubmit = async () => {
    const employeeId = normalizeId(form.employeeId)
    if (!user || isInvalidId(employeeId) || form.overallRating === 0) {
      if (isInvalidId(employeeId)) setError('Please select a valid employee.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const feedback = await feedbackService.submit({
        employeeId,
        managerId: normalizeId(user.userId),
        period: form.reviewPeriod,
        rawFeedback: form.rawFeedback,
        strengths: form.strengths || undefined,
        improvements: form.improvements || undefined,
        overallRating: form.overallRating,
        feedbackTone: form.feedbackTone,
      })
      setSubmittedFeedback(feedback)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedFeedback) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Feedback Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            AI is processing <strong>{selectedEmployee?.name ?? 'employee'}'s</strong> feedback.
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant={submittedFeedback.status === 'COMPLETED' ? 'success' : 'warning'}>
              {submittedFeedback.status}
            </Badge>
            <span className="text-xs text-gray-400">Feedback ID #{submittedFeedback.id}</span>
          </div>
          <div className="bg-brand-50 dark:bg-brand-950 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wide mb-2">What happens next:</p>
            {['Feedback tone analyzed (EQ score)', 'Action plan generated (30/60/90 days)', 'Learning resources matched', 'Employee can view their plan'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 mb-1">
                <ChevronRight className="w-3 h-3" />
                {item}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setSubmittedFeedback(null); setStep(1); setForm(initialForm) }}>
              New Feedback
            </Button>
            <Button className="flex-1" onClick={() => onNavigate('employee-dashboard')}>
              View Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit Feedback</h1>
        <p className="text-gray-500 dark:text-gray-400">Takes 5–10 minutes. AI will handle the rest.</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step === s ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
              : step > s ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-12 transition-all ${step > s ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Step {step} of 3 — {step === 1 ? 'Select Employee' : step === 2 ? 'Feedback Content' : 'Review & Submit'}
        </span>
      </div>

      {step === 1 && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold">Select Employee</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Employee *</label>
              {loadingEmployees ? (
                <div className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400">
                  Loading employees...
                </div>
              ) : (
                <select
                  value={form.employeeId ?? ''}
                  onChange={e => update('employeeId', e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">— Select an employee —</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.jobTitle}{emp.department ? ` (${emp.department})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {employees.length === 0 && !loadingEmployees && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  No employees found. <button className="underline" onClick={() => onNavigate('landing')}>Create an employee first.</button>
                </p>
              )}
            </div>

            {selectedEmployee && (
              <div className="bg-brand-50 dark:bg-brand-950 rounded-xl p-4">
                <div className="text-sm font-semibold text-brand-800 dark:text-brand-200">{selectedEmployee.name}</div>
                <div className="text-xs text-brand-600 dark:text-brand-400">{selectedEmployee.jobTitle}{selectedEmployee.department ? ` · ${selectedEmployee.department}` : ''}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Review Period</label>
              <select
                value={form.reviewPeriod}
                onChange={e => update('reviewPeriod', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Annual 2025'].map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overall Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update('overallRating', n)}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                      form.overallRating >= n
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${form.overallRating >= n ? 'fill-amber-400' : ''}`} />
                  </button>
                ))}
                {form.overallRating > 0 && (
                  <Badge variant="warning" className="self-center ml-2">
                    {['', 'Needs Improvement', 'Below Expectations', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding'][form.overallRating]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} disabled={form.employeeId === null || form.overallRating === 0}>
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold">Feedback Content</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Use a Template</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update('template', t.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.template === t.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t.preview}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Key Strengths</label>
              <textarea value={form.strengths} onChange={e => update('strengths', e.target.value)} rows={3}
                placeholder="What is this employee doing exceptionally well?"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Areas for Improvement</label>
              <textarea value={form.improvements} onChange={e => update('improvements', e.target.value)} rows={3}
                placeholder="Where do they need to grow?"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Raw Feedback * <span className="text-gray-400 font-normal">(AI will refine this)</span>
              </label>
              <textarea value={form.rawFeedback} onChange={e => update('rawFeedback', e.target.value)} rows={5}
                placeholder="Write your feedback naturally. AI will handle clarification, tone normalization, and action planning."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Output Tone</label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map(t => (
                  <button key={t} type="button" onClick={() => update('feedbackTone', t)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      form.feedbackTone === t
                        ? 'border-brand-500 bg-brand-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'
                    }`}
                  >
                    {toneLabels[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}><ChevronLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={() => setStep(3)} disabled={!form.rawFeedback}>Review <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold">Review & Submit</h2>
          </div>
          <div className="space-y-4 mb-6">
            {[
              { label: 'Employee', value: selectedEmployee ? `${selectedEmployee.name} — ${selectedEmployee.jobTitle}` : '' },
              { label: 'Manager', value: user?.name ?? '' },
              { label: 'Period', value: form.reviewPeriod },
              { label: 'Rating', value: `${'⭐'.repeat(form.overallRating)} (${form.overallRating}/5)` },
              { label: 'Output Tone', value: toneLabels[form.feedbackTone] },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.value}</span>
              </div>
            ))}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Raw Feedback Preview</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">{form.rawFeedback}</p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-950 rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-2">AI will generate:</p>
              {['Personalized interpretation', 'Strengths affirmation', 'Growth opportunities', '30/60/90-day action plan', 'Resource recommendations'].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-300 mb-1">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}><ChevronLeft className="w-4 h-4" /> Back</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? 'Submitting...' : 'Submit & Generate Plan'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
