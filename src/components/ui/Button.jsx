import React from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]'

  const variants = {
    // Primary Deep Navy
    primary:
      'bg-[#17365D] text-white hover:bg-[#122B4A] active:bg-[#0E2038] focus-visible:ring-[#17365D]/30 shadow-xs',
    // Royal Blue accent
    royal:
      'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] focus-visible:ring-[#2563EB]/30 shadow-xs',
    // Secondary light neutral
    secondary:
      'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] focus-visible:ring-slate-300',
    // Clean outline
    outline:
      'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:bg-[#F1F5F9] focus-visible:ring-[#2563EB]/20 shadow-xs',
    // Ghost
    ghost:
      'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] focus-visible:ring-slate-300',
    // Danger
    danger:
      'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] focus-visible:ring-[#DC2626]/30 shadow-xs',
    // Danger Outline
    dangerOutline:
      'border border-[#FECACA] text-[#DC2626] bg-white hover:bg-[#FEF2F2] hover:border-[#FCA5A5] focus-visible:ring-[#DC2626]/20',
    // Soft Blue
    softBlue:
      'bg-[#EFF6FF] text-[#17365D] border border-[#DBEAFE] hover:bg-[#DBEAFE] active:bg-[#BFDBFE] font-semibold',
    // Compatibility alias
    subtleNavy:
      'bg-[#EFF6FF] text-[#17365D] border border-[#DBEAFE] hover:bg-[#DBEAFE] active:bg-[#BFDBFE] font-semibold',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 tracking-tight',
    md: 'text-sm px-4 py-2 gap-2 tracking-tight',
    lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
      {children}
    </button>
  )
}
