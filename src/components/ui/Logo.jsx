import React from 'react'

export function Logo({ size = 'md', showTagline = true, className = '' }) {
  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src="/autocare-logo.jpg"
          alt="AutoCare Logo"
          className="w-9 h-9 rounded-xl object-cover border border-[#E2E8F0] shadow-2xs shrink-0"
        />
        <div className="leading-tight">
          <span className="font-extrabold text-[#0F172A] text-base tracking-tight block">
            AutoCare
          </span>
          {showTagline && (
            <span className="text-[10px] font-semibold text-[#2563EB] tracking-wider uppercase block">
              AI-Powered Maintenance
            </span>
          )}
        </div>
      </div>
    )
  }

  if (size === 'lg') {
    return (
      <div className={`flex flex-col items-center gap-3 text-center ${className}`}>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2563EB]/20 to-amber-500/20 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
          <img
            src="/autocare-logo.jpg"
            alt="AutoCare Logo"
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#E2E8F0] shadow-md"
          />
        </div>
        <div>
          <span className="font-extrabold text-[#0F172A] text-2xl sm:text-3xl tracking-tight block">
            AutoCare
          </span>
          {showTagline && (
            <span className="text-xs sm:text-sm font-bold text-[#2563EB] tracking-wider uppercase mt-1 block">
              AI-Powered Vehicle Maintenance
            </span>
          )}
        </div>
      </div>
    )
  }

  // Default 'md'
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/autocare-logo.jpg"
        alt="AutoCare Logo"
        className="w-11 h-11 rounded-xl object-cover border border-[#E2E8F0] shadow-xs shrink-0"
      />
      <div className="leading-tight">
        <span className="font-extrabold text-[#0F172A] text-lg tracking-tight block">
          AutoCare
        </span>
        {showTagline && (
          <span className="text-[11px] font-bold text-[#2563EB] tracking-wider uppercase block">
            AI-Powered Maintenance
          </span>
        )}
      </div>
    </div>
  )
}
