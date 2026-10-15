import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Calendar, Gauge } from 'lucide-react'

export function ReminderFormModal({ isOpen, onClose, onSave, reminder = null, currentOdometer = 0 }) {
  const isEditing = Boolean(reminder)

  const [formData, setFormData] = useState({
    title: '',
    category: 'service',
    due_date: '',
    due_odometer: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title || '',
        category: reminder.category || 'service',
        due_date: reminder.due_date || '',
        due_odometer: reminder.due_odometer || '',
        notes: reminder.notes || '',
      })
    } else {
      setFormData({
        title: '',
        category: 'service',
        due_date: '',
        due_odometer: '',
        notes: '',
      })
    }
    setError(null)
  }, [reminder, isOpen])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Please provide a title for the reminder.')
      return
    }
    if (!formData.due_date && !formData.due_odometer) {
      setError('Please specify at least a due date or a target odometer reading.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onSave({
        ...formData,
        due_date: formData.due_date || null,
        due_odometer: formData.due_odometer ? Number(formData.due_odometer) : null,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to save reminder')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Reminder' : 'Set New Reminder'}
      description="Create a date-based or mileage-based notification checkpoint."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        <Input
          label="Reminder Title"
          placeholder="e.g. Engine Oil Change, Insurance Policy Renewal, PUC Test"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: 'service', label: 'Periodic Service / Maintenance' },
              { value: 'insurance', label: 'Insurance Renewal' },
              { value: 'puc', label: 'PUC / Emission Test' },
              { value: 'inspection', label: 'Annual Vehicle Inspection' },
              { value: 'tax', label: 'Road Tax / Registration' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Input
            label="Target Date (Optional)"
            type="date"
            value={formData.due_date}
            onChange={(e) => handleChange('due_date', e.target.value)}
            icon={Calendar}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Odometer (km)"
            type="number"
            min="0"
            placeholder={currentOdometer ? `Current: ${currentOdometer.toLocaleString()} km` : 'e.g. 30000'}
            value={formData.due_odometer}
            onChange={(e) => handleChange('due_odometer', e.target.value)}
            icon={Gauge}
          />

          <Input
            label="Notes / Instructions"
            placeholder="e.g. Workshop contact, specific grade"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Reminder'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
