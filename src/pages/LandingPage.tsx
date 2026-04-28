import { ArrowRight, Brain, Target, TrendingUp, Shield, Users, Star, CheckCircle, Zap, BarChart3, BookOpen, MessageSquare } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import type { Page } from '../App'

interface Props { onNavigate: (page: Page) => void }

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Interpretation',
    desc: 'Transform vague feedback into crystal-clear, actionable insights using advanced LLMs.',
    color: 'text-brand-500',
    bg: 'bg-brand-50 dark:bg-brand-950',
  },
  {
    icon: Target,
    title: '30/60/90-Day Action Plans',
    desc: 'Concrete milestone-based plans that turn feedback into measurable growth milestones.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    desc: 'Visual dashboards showing employee improvement velocity over time.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    icon: Shield,
    title: 'Emotional Intelligence',
    desc: 'AI scores feedback tone, alerting admins to potentially demotivating patterns.',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950',
  },
  {
    icon: Users,
    title: '360° Peer Feedback',
    desc: 'Aggregate anonymous peer feedback alongside manager insights for a holistic view.',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-950',
  },
  {
    icon: BookOpen,
    title: 'Learning Resources',
    desc: 'Personalized course and resource recommendations tied to each feedback area.',
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-950',
  },
]

const steps = [
  { num: '01', title: 'Manager Submits Feedback', desc: 'Quick 5-minute form with optional templates' },
  { num: '02', title: 'AI Transforms Feedback', desc: 'LLM generates 5 structured output sections' },
  { num: '03', title: 'Employee Reviews Plan', desc: 'Clear, non-judgmental action plan delivered' },
  { num: '04', title: 'Track & Improve', desc: 'Progress logged, milestones celebrated' },
]

const stats = [
  { value: '94%', label: 'Employee clarity improvement' },
  { value: '3.2x', label: 'Faster action plan adoption' },
  { value: '68%', label: 'Reduction in feedback confusion' },
  { value: '89%', label: 'Manager satisfaction score' },
]

export default function LandingPage({ onNavigate }: Props) {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-brand-950 -z-10" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-200/30 dark:bg-brand-800/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-purple-200/30 dark:bg-purple-800/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Feedback Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Turn Ambiguous Feedback into{' '}
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-purple-500 bg-clip-text text-transparent">
              Actionable Growth
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            FeedbackFlow transforms raw manager feedback into personalized development plans, strengths analysis, and step-by-step 90-day roadmaps—powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => onNavigate('feedback-form')} className="group">
              Submit Feedback
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => onNavigate('employee-dashboard')}>
              View Employee Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Everything you need for feedback clarity</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Six core capabilities that bridge the gap between subjective feedback and objective, measurable growth.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <Card key={f.title} hover>
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">How FeedbackFlow Works</h2>
            <p className="text-gray-500 dark:text-gray-400">Four simple steps from raw feedback to empowered growth</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="flex gap-5 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-500/25">
                  {s.num}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Built for Every Role</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                role: 'The Manager',
                tagline: 'Give feedback that actually lands',
                points: ['Quick 5-minute submission form', 'Template library for common scenarios', 'Visibility into feedback impact', 'Tone analytics & coaching'],
                color: 'from-brand-500 to-brand-700',
              },
              {
                icon: Star,
                role: 'The Employee',
                tagline: 'Understand exactly how to grow',
                points: ['Clear, non-judgmental interpretation', 'Concrete weekly action items', 'Personalized learning resources', 'Progress milestones & badges'],
                color: 'from-purple-500 to-pink-600',
              },
              {
                icon: BarChart3,
                role: 'The HR Director',
                tagline: 'Measure what actually matters',
                points: ['Org-wide skill trend dashboards', 'Bias detection alerts', 'Training ROI correlation', 'Compliance audit trails'],
                color: 'from-teal-500 to-green-600',
              },
            ].map(p => (
              <Card key={p.role} className="relative overflow-hidden">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-md`}>
                  <p.icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">{p.role}</div>
                <div className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-4">{p.tagline}</div>
                <ul className="space-y-2">
                  {p.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-800 dark:to-brand-950">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your feedback culture?</h2>
          <p className="text-brand-100 mb-8 text-lg">Join hundreds of organizations using FeedbackFlow to drive measurable employee growth.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => onNavigate('feedback-form')} className="bg-white text-brand-700 hover:bg-brand-50">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="ghost" onClick={() => onNavigate('manager-dashboard')} className="text-white border border-white/30 hover:bg-white/10">
              View Demo Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
