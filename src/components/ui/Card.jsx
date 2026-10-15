import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ children, className, hoverable = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] transition-all duration-200',
        hoverable &&
          'hover:border-[#CBD5E1] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.06),0_4px_6px_-4px_rgba(15,23,42,0.03)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, action, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4.5 border-b border-[#F1F5F9] flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      <div className="space-y-1 min-w-0">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn(
        'text-base sm:text-lg font-bold text-[#0F172A] tracking-tight leading-snug',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-xs sm:text-sm text-[#64748B] leading-relaxed', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] rounded-b-2xl flex items-center justify-between',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
