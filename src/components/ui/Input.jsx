import React from 'react'
import { cn } from '../../lib/utils'

export function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  className,
  icon: Icon,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-[13px] font-semibold text-[#334155] tracking-tight"
        >
          {label} {required && <span className="text-[#DC2626] font-bold">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-[0_1px_2px_0_rgba(15,23,42,0.02)]">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={cn(
            'w-full bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] text-sm placeholder:text-[#94A3B8] py-2.5 transition-all duration-150',
            'focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15',
            'disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed',
            Icon ? 'pl-10 pr-3.5' : 'px-3.5',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15 text-[#991B1B]',
            className
          )}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-[#DC2626] font-medium mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#64748B] mt-1">{hint}</p>
      ) : null}
    </div>
  )
}
