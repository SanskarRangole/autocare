import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  className,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-xs"
            onClick={onClose}
          />

          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'relative w-full transform rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-7 text-left shadow-xl transition-all border border-[#E2E8F0]',
                maxWidth,
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#F1F5F9]">
                <div className="space-y-0.5 pr-6">
                  <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="mt-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
