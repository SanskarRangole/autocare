import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Zap, Sparkles } from 'lucide-react'

const QUICK_PRESETS = [
  { label: '🅿️ Parking', category: 'Tolls & Parking', description: 'Parking Fee' },
  { label: '🛣️ Highway Toll', category: 'Tolls & Parking', description: 'FASTag / Toll Plaza' },
  { label: '🧼 Car Wash', category: 'Wash & Detailing', description: 'Water Wash & Vacuum' },
  { label: '🛠️ Accessories', category: 'Parts & Accessories', description: 'Vehicle Accessory' },
]

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000]

export function ExpenseFormModal({ isOpen, onClose, onSave, expense = null, initialPreset = null }) {
  const isEditing = Boolean(expense)
  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    category: 'Tolls & Parking',
    amount: '',
    date: todayStr,
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || 'Other',
        amount: expense.amount || '',
        date: expense.date || todayStr,
        description: expense.description || '',
      })
    } else if (initialPreset) {
      setFormData({
        category: initialPreset.category || 'Tolls & Parking',
        amount: initialPreset.amount || '',
        date: todayStr,
        description: initialPreset.description || '',
      })
    } else {
      setFormData({
        category: 'Tolls & Parking',
        amount: '',
        date: todayStr,
        description: '',
      })
    }
    setError(null)
  }, [expense, initialPreset, isOpen])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      category: preset.category,
      description: preset.description,
    }))
  }

  const handleSelectAmount = (amt) => {
    setFormData((prev) => ({ ...prev, amount: String(amt) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numAmount = Number(formData.amount)
    if (!numAmount || numAmount <= 0) {
      setError('Please provide a valid expense amount greater than 0.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onSave({
        ...formData,
        amount: numAmount,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense Entry' : 'Log Vehicle Expense'}
      description="Record tolls, parking, detailing, insurance, accessories, or other ownership costs."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        {/* 1-Tap Quick Repeat Preset Chips */}
        {!isEditing && (
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              Quick Repeat Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    formData.category === preset.category && formData.description === preset.description
                      ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                      : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#EFF6FF] hover:border-[#BFDBFE]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Expense Category"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: 'Tolls & Parking', label: 'Tolls & Parking' },
              { value: 'Wash & Detailing', label: 'Wash & Detailing' },
              { value: 'Insurance', label: 'Insurance Policy' },
              { value: 'PUC / Inspection', label: 'PUC & Inspection Tests' },
              { value: 'Parts & Accessories', label: 'Parts & Accessories' },
              { value: 'Fine / Legal', label: 'Fines & Traffic Penalties' },
              { value: 'Other', label: 'Other Operating Expense' },
            ]}
          />

          <Input
            label="Expense Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />
        </div>

        {/* Amount with Quick Chips */}
        <div className="space-y-1.5">
          <Input
            label="Amount Paid"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            required
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-[#D97706]" /> Quick:
            </span>
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectAmount(amt)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md border transition-all ${
                  Number(formData.amount) === amt
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#EFF6FF]'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Description / Purpose"
          placeholder="e.g. Airport parking fee, Highway toll recharge"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading} className="px-6 font-bold">
            {isEditing ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
