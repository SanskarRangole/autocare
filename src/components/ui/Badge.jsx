import React from 'react'
import { cn } from '../../lib/utils'

export function Badge({ children, variant = 'neutral', className, ...props }) {
  const variants = {
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    primary: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE] font-semibold',
    navy: 'bg-[#EFF6FF] text-[#17365D] border-[#DBEAFE] font-semibold',
    success: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] font-semibold',
    warning: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A] font-semibold',
    danger: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] font-semibold',
    indigo: 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE] font-semibold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border tracking-tight select-none font-medium',
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
