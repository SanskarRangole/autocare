import React from 'react'
import { Button } from './Button'
import { Plus } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <div className="py-16 px-6 text-center border border-dashed border-[#CBD5E1] rounded-3xl bg-white/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.02)] max-w-2xl mx-auto my-4">
      {Icon && (
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center mb-4 shadow-xs">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] max-w-md mx-auto mt-2 mb-6 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button variant="primary" size="md" onClick={onAction}>
            <Plus className="w-4 h-4 mr-1.5" />
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" size="md" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
