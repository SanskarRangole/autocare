import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  Wrench,
  Gauge,
  Calendar,
  Building2,
  DollarSign,
  Copy,
  Check,
  Printer,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../lib/utils'

export function BeforeYouServiceModal({
  isOpen,
  onClose,
  vehicle,
  services = [],
  reminders = [],
  currency = 'USD',
}) {
  const [copied, setCopied] = useState(false)

  if (!vehicle) return null

  const latestService = services[0] || null
  const currentOdo = Number(vehicle.current_odometer) || 0
  const lastOdo = latestService?.odometer ? Number(latestService.odometer) : null
  const kmSinceLastService = lastOdo ? currentOdo - lastOdo : null

  const pendingReminders = reminders.filter((r) => !r.is_completed)

  const handleCopySummary = () => {
    const text = `
=== AUTOCARE PRE-SERVICE BRIEF ===
Vehicle: ${vehicle.name} (${vehicle.year || ''} ${vehicle.make} ${vehicle.model})
Plate: ${vehicle.license_plate || 'N/A'} | VIN: ${vehicle.vin || 'N/A'}
Current Odometer: ${currentOdo.toLocaleString()} km
${lastOdo ? `Km driven since last service: ${kmSinceLastService?.toLocaleString()} km` : ''}

LAST SERVICE RECORD:
- Date: ${latestService ? formatDate(latestService.date) : 'N/A'}
- Garage: ${latestService?.garage || 'N/A'}
- Cost: ${latestService ? formatCurrency(latestService.cost, currency) : 'N/A'}
- Work Notes: ${latestService?.notes || 'Regular maintenance'}

ATTENTION / WORK ITEMS REQUESTED:
${
  pendingReminders.length > 0
    ? pendingReminders.map((r, i) => `${i + 1}. ${r.title} ${r.due_date ? `(Due: ${r.due_date})` : ''}`).join('\n')
    : '- General periodic maintenance and multipoint safety check'
}
===================================
`.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Before You Service — Mechanic Brief"
      description="Quick workshop checklist with previous service history and active maintenance items."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Vehicle Header Card */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#0F172A]">{vehicle.name}</h3>
            <Badge variant="primary">{vehicle.fuel_type || 'Fuel'}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#64748B]">
            <div>
              Plate: <strong className="text-[#0F172A]">{vehicle.license_plate || '-'}</strong>
            </div>
            <div>
              Current Odo: <strong className="text-[#0F172A]">{currentOdo.toLocaleString()} km</strong>
            </div>
            <div>
              VIN: <strong className="text-[#0F172A]">{vehicle.vin ? vehicle.vin.slice(0, 10) + '...' : '-'}</strong>
            </div>
          </div>
        </div>

        {/* Previous Service Snapshot */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#17365D] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#2563EB]" />
              Last Service Details
            </span>
            {kmSinceLastService !== null && (
              <span className="text-[#2563EB] font-bold">
                +{kmSinceLastService.toLocaleString()} km driven since
              </span>
            )}
          </div>

          {latestService ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block">Date</span>
                <span className="font-bold text-[#0F172A]">{formatDate(latestService.date)}</span>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block">Workshop</span>
                <span className="font-bold text-[#0F172A] truncate block">{latestService.garage || 'Independent'}</span>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-[#64748B] block">Cost</span>
                <span className="font-bold text-[#0F172A]">{formatCurrency(latestService.cost, currency)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#64748B] italic">No previous service records logged for this vehicle.</p>
          )}

          {latestService?.notes && (
            <p className="text-xs text-[#475569] bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0]">
              <strong>Previous Notes:</strong> {latestService.notes}
            </p>
          )}
        </div>

        {/* Pending Items Checklist */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2.5">
          <div className="text-xs font-bold text-[#17365D] uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-[#2563EB]" />
            Items to Inspect & Service
          </div>

          {pendingReminders.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {pendingReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[#0F172A] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    {rem.title}
                  </span>
                  {rem.due_date && <span className="text-[#64748B]">{formatDate(rem.due_date)}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#16A34A] flex items-center gap-1.5 py-1">
              <CheckCircle2 className="w-4 h-4" />
              All scheduled checkpoints up to date! Request a standard multipoint safety check.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-[#16A34A]" /> Copied Brief!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Brief for Mechanic
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5 mr-1" /> Print
            </Button>
          </div>
          <Button variant="primary" size="md" onClick={onClose} className="font-bold">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}
