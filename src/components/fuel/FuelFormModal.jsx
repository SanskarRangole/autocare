import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  Gauge,
  Droplets,
  Calculator,
  Fuel,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react'
import { getFuelLogs } from '../../lib/storage'

export function FuelFormModal({
  isOpen,
  onClose,
  onSave,
  fuelLog = null,
  currentOdometer = 0,
  vehicle = null,
  previousLog = null,
}) {
  const isEditing = Boolean(fuelLog)
  const todayStr = new Date().toISOString().split('T')[0]

  const [lastFuelLog, setLastFuelLog] = useState(previousLog)
  const [showAdvanced, setShowAdvanced] = useState(isEditing)

  const [formData, setFormData] = useState({
    date: todayStr,
    odometer: currentOdometer || 0,
    litres: '',
    total_cost: '',
    price_per_litre: '',
    is_full_tank: true,
    missed_previous_fill: false,
    fuel_brand: '',
    notes: '',
  })

  // Track which field was edited last for 2-of-3 calculation
  const [lastEdited, setLastEdited] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch most recent fuel log if not passed to enable smart repeat
  useEffect(() => {
    async function fetchPrevious() {
      if (vehicle?.id && !previousLog && !fuelLog) {
        try {
          const logs = await getFuelLogs(vehicle.id)
          if (logs && logs.length > 0) {
            setLastFuelLog(logs[0])
          }
        } catch (e) {
          console.warn('Could not fetch previous fuel log:', e)
        }
      }
    }
    if (isOpen) {
      fetchPrevious()
    }
  }, [vehicle?.id, previousLog, fuelLog, isOpen])

  useEffect(() => {
    if (fuelLog) {
      const litresVal = fuelLog.litres || ''
      const costVal = fuelLog.total_cost || ''
      const priceVal =
        fuelLog.price_per_litre ||
        (Number(litresVal) > 0 && Number(costVal) > 0
          ? (Number(costVal) / Number(litresVal)).toFixed(2)
          : '')

      setFormData({
        date: fuelLog.date || todayStr,
        odometer: fuelLog.odometer ?? currentOdometer,
        litres: litresVal,
        total_cost: costVal,
        price_per_litre: priceVal,
        is_full_tank: fuelLog.is_full_tank ?? true,
        missed_previous_fill: fuelLog.missed_previous_fill ?? false,
        fuel_brand: fuelLog.fuel_brand || '',
        notes: fuelLog.notes || '',
      })
      setShowAdvanced(true)
    } else {
      setFormData({
        date: todayStr,
        odometer: currentOdometer || 0,
        litres: '',
        total_cost: '',
        price_per_litre: '',
        is_full_tank: true,
        missed_previous_fill: false,
        fuel_brand: lastFuelLog?.fuel_brand || '',
        notes: '',
      })
      setShowAdvanced(false)
    }
    setError(null)
    setLastEdited(null)
  }, [fuelLog, isOpen, currentOdometer, lastFuelLog])

  // Bidirectional 2-of-3 calculation
  const handleMetricChange = (field, value) => {
    setLastEdited(field)
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      const cost = Number(field === 'total_cost' ? value : prev.total_cost)
      const litres = Number(field === 'litres' ? value : prev.litres)
      const price = Number(field === 'price_per_litre' ? value : prev.price_per_litre)

      if (field === 'price_per_litre' && price > 0) {
        if (cost > 0 && lastEdited !== 'litres') {
          updated.litres = (cost / price).toFixed(2)
        } else if (litres > 0) {
          updated.total_cost = (litres * price).toFixed(2)
        }
      } else if (field === 'total_cost' && cost > 0) {
        if (price > 0 && lastEdited === 'price_per_litre') {
          updated.litres = (cost / price).toFixed(2)
        } else if (litres > 0) {
          updated.price_per_litre = (cost / litres).toFixed(2)
        }
      } else if (field === 'litres' && litres > 0) {
        if (price > 0 && lastEdited === 'price_per_litre') {
          updated.total_cost = (litres * price).toFixed(2)
        } else if (cost > 0) {
          updated.price_per_litre = (cost / litres).toFixed(2)
        }
      }

      return updated
    })
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Quick preset chips (e.g. ₹500, ₹1000, ₹2000, ₹3000)
  const handleSelectQuickAmount = (amt) => {
    handleMetricChange('total_cost', String(amt))
  }

  // Repeat last fill in 1 click
  const handleRepeatLastFill = () => {
    if (!lastFuelLog) return
    const prevCost = lastFuelLog.total_cost || ''
    const prevLitres = lastFuelLog.litres || ''
    const prevBrand = lastFuelLog.fuel_brand || ''

    setFormData((prev) => ({
      ...prev,
      total_cost: prevCost,
      litres: prevLitres,
      fuel_brand: prevBrand,
      is_full_tank: lastFuelLog.is_full_tank ?? true,
      price_per_litre: lastFuelLog.price_per_litre || '',
      date: todayStr,
      odometer: currentOdometer || prev.odometer,
    }))
    if (prevLitres) setShowAdvanced(true)
  }

  const numLitres = Number(formData.litres) || 0
  const numCost = Number(formData.total_cost) || 0
  const numPrice = Number(formData.price_per_litre) || (numLitres > 0 ? numCost / numLitres : 0)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (numCost <= 0) {
      setError('Please provide a valid fuel amount paid.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const isSpendingOnly = numLitres <= 0

      await onSave({
        ...formData,
        odometer: Number(formData.odometer) || Number(currentOdometer) || 0,
        litres: numLitres,
        total_cost: numCost,
        price_per_litre: numPrice > 0 ? Number(numPrice.toFixed(3)) : null,
        is_full_tank: isSpendingOnly ? false : Boolean(formData.is_full_tank),
        is_spending_only: isSpendingOnly,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to save fuel log')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Fuel Refill' : 'Quick Fuel Refill'}
      description="Record fuel spending in seconds. Odometer and litres are optional."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        {/* Vehicle Header & Current Status */}
        {vehicle && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
            <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-[#2563EB]" />
              {vehicle.name}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{vehicle.fuel_type || 'Fuel'}</Badge>
              <span className="text-[#64748B]">Odo: {Number(currentOdometer).toLocaleString()} km</span>
            </div>
          </div>
        )}

        {/* 1-Tap Repeat Last Fuel Action */}
        {!isEditing && lastFuelLog && Number(lastFuelLog.total_cost) > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#F8FAFC] border border-[#BFDBFE] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#1E40AF] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                Repeat Last Fill
              </div>
              <p className="text-xs text-[#1E293B] font-medium truncate mt-0.5">
                {Number(lastFuelLog.total_cost).toLocaleString()} {lastFuelLog.litres > 0 ? `(${lastFuelLog.litres} L)` : ''}{' '}
                {lastFuelLog.fuel_brand ? `@ ${lastFuelLog.fuel_brand}` : ''}
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleRepeatLastFill}
              className="shrink-0 text-xs shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Repeat
            </Button>
          </div>
        )}

        {/* Hero Amount Paid Input */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#2563EB]/30 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Fuel Amount Paid <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              min="1"
              step="any"
              placeholder="0.00"
              value={formData.total_cost}
              onChange={(e) => handleMetricChange('total_cost', e.target.value)}
              className="text-2xl font-black text-[#0F172A] pl-3 py-2.5 h-14"
              autoFocus={!isEditing}
              required
            />
          </div>

          {/* Quick Amount Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-[#D97706]" /> Quick:
            </span>
            {[500, 1000, 2000, 3000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectQuickAmount(amt)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                  Number(formData.total_cost) === amt
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#F8FAFC] text-[#334155] border-[#E2E8F0] hover:bg-[#EFF6FF] hover:border-[#BFDBFE]'
                }`}
              >
                {amt.toLocaleString()}
              </button>
            ))}
            {lastFuelLog &&
              Number(lastFuelLog.total_cost) > 0 &&
              ![500, 1000, 2000, 3000].includes(Number(lastFuelLog.total_cost)) && (
                <button
                  type="button"
                  onClick={() => handleSelectQuickAmount(lastFuelLog.total_cost)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] hover:bg-[#DBEAFE]"
                >
                  Last: {Number(lastFuelLog.total_cost).toLocaleString()}
                </button>
              )}
          </div>

          {numLitres <= 0 && numCost > 0 && (
            <p className="text-[11px] text-[#64748B] bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
              💡 <strong>Fast Mode:</strong> Saving with amount only will record the fuel expense without affecting fuel economy calculations.
            </p>
          )}
        </div>

        {/* Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fill Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
          />

          <Input
            label="Fuel Brand / Station (Optional)"
            placeholder="e.g. IndianOil, Shell, BP"
            value={formData.fuel_brand}
            onChange={(e) => handleChange('fuel_brand', e.target.value)}
          />
        </div>

        {/* Expandable Advanced Details: Litres, Odometer, Full Tank */}
        <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-[#FFFFFF]">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="w-full flex items-center justify-between p-3.5 bg-[#F8FAFC] text-xs font-bold text-[#17365D] hover:bg-[#F1F5F9] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#2563EB]" />
              {showAdvanced
                ? 'Hide Precision Details (Litres & Odometer)'
                : '+ Add Litres & Odometer for Mileage Economy'}
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-[#64748B]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#64748B]" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-4 border-t border-[#E2E8F0] bg-[#FFFFFF]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Litres Filled"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 35.5"
                  value={formData.litres}
                  onChange={(e) => handleMetricChange('litres', e.target.value)}
                  icon={Droplets}
                />

                <Input
                  label="Price per Litre"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 98.50"
                  value={formData.price_per_litre}
                  onChange={(e) => handleMetricChange('price_per_litre', e.target.value)}
                />

                <Input
                  label="Odometer (km)"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={formData.odometer}
                  onChange={(e) => handleChange('odometer', e.target.value)}
                  icon={Gauge}
                />
              </div>

              {/* Tank Status Toggles */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_full_tank}
                    onChange={(e) => handleChange('is_full_tank', e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">
                      Filled Tank to Full (Recommended)
                    </span>
                    <span className="text-[11px] text-[#64748B] block">
                      Required for authentic tank-to-tank fuel efficiency calculation
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={formData.missed_previous_fill}
                    onChange={(e) => handleChange('missed_previous_fill', e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] border-[#CBD5E1] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0F172A] block">
                      Missed an intermediate refill?
                    </span>
                    <span className="text-[11px] text-[#64748B] block">
                      Prevents skipped refills from skewing mileage averages
                    </span>
                  </div>
                </label>
              </div>

              <Input
                label="Notes (Optional)"
                placeholder="e.g. Highway cruise, AC on full"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
          <Button variant="outline" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" loading={loading} className="px-6 font-bold">
            {isEditing ? 'Save Changes' : 'Record Fuel Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
