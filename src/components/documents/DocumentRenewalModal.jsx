import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  ShieldCheck,
  Calendar,
  Upload,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import {
  uploadDocument,
  updateDocument,
  updateVehicle,
  createReminder,
  getReminders,
  updateReminder,
} from '../../lib/storage'
import { formatDate } from '../../lib/utils'

export function DocumentRenewalModal({
  isOpen,
  onClose,
  documentItem = null,
  docType = 'Insurance Policy',
  vehicle = null,
  userId = null,
  onSuccess = null,
}) {
  const [file, setFile] = useState(null)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const activeDocType = documentItem?.type || docType
  const isInsurance = activeDocType.toLowerCase().includes('insurance')
  const isPuc = activeDocType.toLowerCase().includes('puc') || activeDocType.toLowerCase().includes('pollution')

  useEffect(() => {
    // Intelligent suggested expiry date
    const targetDate = new Date()
    if (isInsurance) {
      targetDate.setFullYear(targetDate.getFullYear() + 1)
    } else if (isPuc) {
      targetDate.setMonth(targetDate.getMonth() + 6)
    } else {
      targetDate.setFullYear(targetDate.getFullYear() + 1)
    }
    setNewExpiryDate(targetDate.toISOString().split('T')[0])
    setNotes(documentItem ? `Renewed from previous policy (valid through ${documentItem.expiry_date || 'N/A'})` : '')
    setFile(null)
    setError(null)
  }, [documentItem, docType, isOpen, isInsurance, isPuc])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newExpiryDate) {
      setError('Please provide the new verified expiry date.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // 1. Upload or update document
      if (file && userId && vehicle) {
        await uploadDocument(userId, vehicle.id, file, {
          name: documentItem?.name || `${activeDocType} (${new Date().getFullYear()})`,
          type: activeDocType,
          expiry_date: newExpiryDate,
          notes: notes || 'Renewed document',
        })
      } else if (documentItem) {
        await updateDocument(documentItem.id, {
          expiry_date: newExpiryDate,
          notes: notes || 'Renewed date',
        })
      }

      // 2. Synchronize vehicle profile compliance date
      if (vehicle) {
        const vehicleUpdates = {}
        if (isInsurance) vehicleUpdates.insurance_expiry = newExpiryDate
        if (isPuc) vehicleUpdates.puc_expiry = newExpiryDate
        if (Object.keys(vehicleUpdates).length > 0) {
          await updateVehicle(vehicle.id, vehicleUpdates)
        }
      }

      // 3. Update or create corresponding reminder to prevent stale alerts
      if (userId && vehicle) {
        try {
          const reminders = await getReminders(vehicle.id)
          const reminderTitle = isInsurance
            ? 'Insurance Policy Renewal'
            : isPuc
            ? 'PUC Emission Check Renewal'
            : `${activeDocType} Renewal`

          const existingRem = reminders.find((r) =>
            r.title.toLowerCase().includes(isInsurance ? 'insurance' : isPuc ? 'puc' : activeDocType.toLowerCase())
          )

          if (existingRem) {
            await updateReminder(existingRem.id, {
              due_date: newExpiryDate,
              is_completed: false,
              notes: `Auto-updated on document renewal: ${notes}`,
            })
          } else {
            await createReminder(userId, vehicle.id, {
              title: reminderTitle,
              type: isInsurance ? 'Insurance' : isPuc ? 'PUC' : 'Other',
              due_date: newExpiryDate,
              notes: `Reminder created from document renewal on ${new Date().toISOString().split('T')[0]}`,
            })
          }
        } catch (remErr) {
          console.warn('Could not sync renewal reminder:', remErr)
        }
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to complete document renewal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Renew ${activeDocType}`}
      description="Update compliance expiry dates and upload the new policy or certificate in one action."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        {/* Current Document Summary */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              {activeDocType}
            </span>
            <Badge variant="primary">{vehicle?.name || 'Active Vehicle'}</Badge>
          </div>
          {documentItem?.expiry_date && (
            <p className="text-xs text-[#64748B]">
              Previous Expiry: <strong className="text-[#0F172A]">{formatDate(documentItem.expiry_date)}</strong>
            </p>
          )}
        </div>

        {/* File Upload for new policy */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Upload Renewed Document (PDF, JPG, PNG)
          </label>
          <div className="border border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-white">
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              className="text-xs text-[#64748B] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EFF6FF] file:text-[#1E40AF] hover:file:bg-[#DBEAFE] cursor-pointer"
            />
            {file && (
              <p className="text-xs text-[#16A34A] font-semibold mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        {/* New Verified Expiry Date */}
        <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider">
              New Expiry Date *
            </label>
            <span className="text-[11px] font-semibold text-[#2563EB]">
              {isInsurance ? 'Suggested: +1 Year' : isPuc ? 'Suggested: +6 Months' : 'Verified Expiry'}
            </span>
          </div>
          <Input
            type="date"
            value={newExpiryDate}
            onChange={(e) => setNewExpiryDate(e.target.value)}
            required
            className="bg-white"
          />
        </div>

        <Input
          label="Renewal Notes (Optional)"
          placeholder="e.g. Comprehensive insurance via PolicyBazaar, Policy #98124"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading} className="px-6 font-bold">
            Confirm Renewal
          </Button>
        </div>
      </form>
    </Modal>
  )
}
