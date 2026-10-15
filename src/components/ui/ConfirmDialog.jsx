import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone and will permanently remove this record.',
  confirmText = 'Delete Record',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-3.5 bg-[#FEF2F2] p-4 rounded-xl border border-[#FECACA] text-[#991B1B]">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="md"
            loading={loading}
            onClick={async () => {
              await onConfirm()
              onClose()
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
