import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={clsx(
      'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm',
      hover && 'hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-200',
      className
    )}>
      {children}
    </div>
  )
}
