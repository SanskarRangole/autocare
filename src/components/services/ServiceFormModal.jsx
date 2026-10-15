import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Calendar, Gauge, Building2, BellRing, Upload, CheckCircle2, FileText } from 'lucide-react'

export function ServiceFormModal({
  isOpen,
  onClose,
  onSave,
  service = null,
  repeatSource = null,
  currentOdometer = 0,
  vehicle = null,
  pastGarages = [],
}) {
  const isEditing = Boolean(service)
  const isRepeating = Boolean(repeatSource)
  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    date: todayStr,
    odometer: currentOdometer || 0,
    service_type: 'Periodic Maintenance',
    garage: '',
    cost: '',
    notes: '',
    next_due_date: '',
    next_due_odometer: '',
  })

  const [invoiceFile, setInvoiceFile] = useState(null)
  const [scheduleNextReminder, setScheduleNextReminder] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (service) {
      setFormData({
        date: service.date || todayStr,
        odometer: service.odometer ?? currentOdometer,
        service_type: service.service_type || 'Periodic Maintenance',
        garage: service.garage || '',
        cost: service.cost || '',
        notes: service.notes || '',
        next_due_date: service.next_due_date || '',
        next_due_odometer: service.next_due_odometer || '',
      })
      setScheduleNextReminder(false)
      setInvoiceFile(null)
    } else if (repeatSource) {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 6)
      const suggestedNextDate = futureDate.toISOString().split('T')[0]
      const suggestedNextOdo = (Number(currentOdometer) || 0) + 10000

      setFormData({
        date: todayStr,
        odometer: currentOdometer || 0,
        service_type: repeatSource.service_type || 'Periodic Maintenance',
        garage: repeatSource.garage || '',
        cost: repeatSource.cost ? String(repeatSource.cost) : '',
        notes: repeatSource.notes || '',
        next_due_date: suggestedNextDate,
        next_due_odometer: suggestedNextOdo,
      })
      setScheduleNextReminder(true)
      setInvoiceFile(null)
    } else {
      // Calculate suggested 6-month & +10,000 km maintenance checkpoint
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 6)
      const suggestedNextDate = futureDate.toISOString().split('T')[0]
      const suggestedNextOdo = (Number(currentOdometer) || 0) + 10000

      setFormData({
        date: todayStr,
        odometer: currentOdometer || 0,
        service_type: 'Periodic Maintenance',
        garage: '',
        cost: '',
        notes: '',
        next_due_date: suggestedNextDate,
        next_due_odometer: suggestedNextOdo,
      })
      setScheduleNextReminder(true)
      setInvoiceFile(null)
    }
    setError(null)
  }, [service, repeatSource, isOpen, currentOdometer])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.service_type.trim()) {
      setError('Service type is required.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const cleanCost = Number(formData.cost) || 0
      const cleanOdo = Number(formData.odometer) || 0
      const nextDueOdo = formData.next_due_odometer ? Number(formData.next_due_odometer) : null
      const nextDueDate = formData.next_due_date || null

      const servicePayload = {
        ...formData,
        odometer: cleanOdo,
        cost: cleanCost,
        next_due_odometer: nextDueOdo,
        next_due_date: nextDueDate,
      }

      // If user opted to schedule future reminder
      let autoReminderPayload = null
      if (!isEditing && scheduleNextReminder && (nextDueDate || nextDueOdo)) {
        autoReminderPayload = {
          title: `Next Service: ${formData.service_type}`,
          category: 'service',
          due_date: nextDueDate,
          due_odometer: nextDueOdo,
          notes: `Auto-suggested after service at ${formData.garage || 'garage'} on ${formData.date}`,
        }
      }

      await onSave(servicePayload, invoiceFile, autoReminderPayload)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to save service record')
    } finally {
      setLoading(false)
    }
  }

  const commonGarages = Array.from(
    new Set([
      'Authorized Brand Service Center',
      'Bosch Car Service',
      'Quick Lube & Tune',
      'Local Independent Mechanic',
      ...pastGarages,
    ])
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Service Record' : 'Record Service & Maintenance'}
      description="Log work performed, cost incurred, and future service checkpoints."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        {isRepeating && repeatSource && (
          <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1E40AF] block">
                Repeating: {repeatSource.service_type}
              </span>
              <span className="text-[#64748B] block mt-0.5">
                Garage and details prefilled. Verify date, cost, and odometer.
              </span>
            </div>
            <Badge variant="primary">1-Tap Repeat</Badge>
          </div>
        )}

        {/* Vehicle Badge */}
        {vehicle && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
            <span className="font-semibold text-[#0F172A]">{vehicle.name}</span>
            <span className="text-[#64748B]">Odo: {Number(currentOdometer).toLocaleString()} km</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Service Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />

          <Input
            label="Odometer at Service (km)"
            type="number"
            min="0"
            value={formData.odometer}
            onChange={(e) => handleChange('odometer', e.target.value)}
            icon={Gauge}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Service Type / Task"
            value={formData.service_type}
            onChange={(e) => handleChange('service_type', e.target.value)}
            options={[
              { value: 'Periodic Maintenance', label: 'Periodic Maintenance (Scheduled)' },
              { value: 'Oil & Filter Change', label: 'Oil & Filter Change' },
              { value: 'Brake Pads & Rotors', label: 'Brake System / Pads' },
              { value: 'Tire Replacement & Balance', label: 'Tires / Rotation / Alignment' },
              { value: 'Battery Replacement', label: 'Battery Replacement' },
              { value: 'Coolant / Fluid Flush', label: 'Coolant / Fluid Flush' },
              { value: 'Transmission Service', label: 'Transmission / Clutch Service' },
              { value: 'Suspension & Steering', label: 'Suspension / Steering' },
              { value: 'Electrical & AC System', label: 'Electrical / Air Conditioning' },
              { value: 'General Repair', label: 'General / Unscheduled Repair' },
            ]}
          />

          <div>
            <Input
              label="Garage / Service Center"
              placeholder="e.g. Authorized Dealer"
              value={formData.garage}
              onChange={(e) => handleChange('garage', e.target.value)}
              icon={Building2}
              list="garage-suggestions"
            />
            <datalist id="garage-suggestions">
              {commonGarages.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
        </div>

        <Input
          label="Total Cost Incurred"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={formData.cost}
          onChange={(e) => handleChange('cost', e.target.value)}
          hint="Automatically synchronizes into your vehicle expenses ledger without double-counting"
        />

        {/* Next Service Due Checkpoint */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#2563EB]" /> Next Service Checkpoint
            </span>
            {!isEditing && (
              <label className="flex items-center gap-1.5 text-xs text-[#2563EB] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleNextReminder}
                  onChange={(e) => setScheduleNextReminder(e.target.checked)}
                  className="rounded text-[#2563EB] border-[#CBD5E1] cursor-pointer"
                />
                Auto-create reminder
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Next Due Date"
              type="date"
              value={formData.next_due_date}
              onChange={(e) => handleChange('next_due_date', e.target.value)}
            />

            <Input
              label="Next Due Odometer (km)"
              type="number"
              placeholder="e.g. 38450"
              value={formData.next_due_odometer}
              onChange={(e) => handleChange('next_due_odometer', e.target.value)}
              icon={Gauge}
            />
          </div>
        </div>

        {/* Optional Invoice Upload */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#334155]">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#64748B]" />
              Attach Service Bill / Invoice (Optional)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              id="service-invoice-file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="service-invoice-file"
              className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-medium text-[#0F172A] cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
              {invoiceFile ? 'Change Invoice' : 'Choose Receipt Image / PDF'}
            </label>
            {invoiceFile && (
              <span className="text-xs text-[#059669] flex items-center gap-1 truncate max-w-[200px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {invoiceFile.name}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <Input
          label="Work Notes & Parts (Optional)"
          placeholder="e.g. Mobil1 5W-30 synthetic, OEM oil filter #15400-PLM-A02"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Record Service'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
