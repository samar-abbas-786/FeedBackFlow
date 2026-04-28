interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  color?: 'brand' | 'green' | 'amber' | 'red'
}

const colors = {
  brand: 'bg-brand-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

export default function ProgressBar({ value, max = 100, label, color = 'brand' }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
