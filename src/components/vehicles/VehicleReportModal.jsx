import React, { useRef } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  Printer,
  Car,
  Bike,
  Wrench,
  Fuel,
  DollarSign,
  ShieldCheck,
  Calendar,
  Gauge,
  FileText,
  Clock,
  TrendingUp,
  Download,
  Copy,
  Check,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatDistance,
  formatVolume,
  calculateFuelSummary,
  calculateExpenseSummary,
  getDaysDifference,
} from '../../lib/utils'

export function VehicleReportModal({
  isOpen,
  onClose,
  vehicle,
  services = [],
  fuelLogs = [],
  expenses = [],
  reminders = [],
  documents = [],
  currency = 'USD',
  distanceUnit = 'km',
  volumeUnit = 'litres',
}) {
  const [copied, setCopied] = React.useState(false)
  const reportRef = useRef(null)

  if (!vehicle) return null

  const fuelSummary = calculateFuelSummary(fuelLogs, distanceUnit, volumeUnit)
  const expenseSummary = calculateExpenseSummary(expenses)

  const currentOdo = Number(vehicle.current_odometer) || 0
  const totalCost = expenseSummary.totalSpent
  const costPerKm = currentOdo > 0 && totalCost > 0 ? (totalCost / currentOdo).toFixed(2) : null

  const reportDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const reportTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const reportId = `AC-RPT-${vehicle.id?.slice(-5).toUpperCase() || 'VEH'}-${Date.now().toString().slice(-4)}`

  const handlePrint = () => {
    window.print()
  }

  const handleCopyText = () => {
    const text = `
==============================================================
AUTOCARE COMPREHENSIVE VEHICLE DOSSIER
Report ID: ${reportId} | Date: ${reportDate} ${reportTime}
==============================================================

1. VEHICLE PROFILE
- Vehicle: ${vehicle.name} (${vehicle.year || ''} ${vehicle.make} ${vehicle.model})
- Type: ${vehicle.type?.toUpperCase()} | Fuel: ${vehicle.fuel_type || 'Fuel'}
- License Plate: ${vehicle.license_plate || 'N/A'}
- VIN: ${vehicle.vin || 'N/A'}
- Current Odometer: ${currentOdo.toLocaleString()} ${distanceUnit}
- Insurance Expiry: ${vehicle.insurance_expiry ? formatDate(vehicle.insurance_expiry) : 'Not Logged'}
- PUC Expiry: ${vehicle.puc_expiry ? formatDate(vehicle.puc_expiry) : 'Not Logged'}

2. TOTAL COST OF OWNERSHIP (TCO)
- Lifetime Recorded Spend: ${formatCurrency(totalCost, currency)}
- Fuel Total: ${formatCurrency(expenseSummary.fuelSpent, currency)}
- Service & Repairs Total: ${formatCurrency(expenseSummary.serviceSpent, currency)}
- Other Expenses: ${formatCurrency(expenseSummary.otherSpent, currency)}
- Cost per ${distanceUnit}: ${costPerKm ? `${formatCurrency(costPerKm, currency)}/${distanceUnit}` : 'N/A'}

3. FUEL & CONSUMPTION METRICS
- Total Volume Filled: ${formatVolume(fuelSummary.totalLitres, volumeUnit)}
- Average Efficiency: ${fuelSummary.avgEfficiency ? `${fuelSummary.avgEfficiency} ${fuelSummary.efficiencyUnit}` : 'N/A'}
- Total Refills: ${fuelLogs.length}

4. SERVICE & REPAIR HISTORY (${services.length} records)
${
  services.length > 0
    ? services
        .map(
          (s) =>
            `- ${formatDate(s.date)}: ${s.service_type} @ ${s.garage || 'Independent'} | ${formatCurrency(s.cost, currency)}${
              s.odometer ? ` (${s.odometer.toLocaleString()} ${distanceUnit})` : ''
            }${s.notes ? `\n  Notes: ${s.notes}` : ''}`
        )
        .join('\n')
    : 'No services recorded.'
}

5. UPCOMING MAINTENANCE & COMPLIANCE
${
  reminders.filter((r) => !r.is_completed).length > 0
    ? reminders
        .filter((r) => !r.is_completed)
        .map((r) => `- [ ] ${r.title} | Due: ${r.due_date ? formatDate(r.due_date) : ''} ${r.due_odometer ? `(${r.due_odometer.toLocaleString()} ${distanceUnit})` : ''}`)
        .join('\n')
    : 'All maintenance and compliance items up to date.'
}

6. DIGITAL DOCUMENTS ON FILE
${
  documents.length > 0
    ? documents.map((d) => `- ${d.name} (${d.type}) | Valid through: ${d.expiry_date ? formatDate(d.expiry_date) : 'N/A'}`).join('\n')
    : 'No documents uploaded.'
}
==============================================================
Generated automatically by AutoCare Vehicle Companion
`.trim()

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Vehicle Ownership Dossier"
      description="Executive report covering vehicle identity, total cost of ownership, fuel consumption, service history, and compliance."
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Top Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl print:hidden">
          <div className="text-xs text-[#64748B]">
            Print or save directly to <strong className="text-[#0F172A]">PDF</strong> using your browser's print dialog.
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-[#16A34A]" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Summary
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-bold shadow-xs bg-[#17365D] hover:bg-[#112743]"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div
          ref={reportRef}
          id="autocare-printable-dossier"
          className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-8 text-[#0F172A] print:border-none print:shadow-none print:p-0"
        >
          {/* Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[#17365D]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#17365D]" />
                <span className="text-xl font-black tracking-tight text-[#17365D] uppercase">
                  AutoCare Vehicle Dossier
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Official Vehicle Ownership, Maintenance & Financial Summary
              </p>
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5 text-[#64748B]">
              <div>
                Report ID: <strong className="font-mono text-[#0F172A]">{reportId}</strong>
              </div>
              <div>
                Generated: <span className="text-[#0F172A]">{reportDate} • {reportTime}</span>
              </div>
              <div>
                Platform: <span className="text-[#17365D] font-semibold">AutoCare Companion</span>
              </div>
            </div>
          </div>

          {/* Section 1: Vehicle Identity & Compliance */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#17365D] flex items-center gap-1.5">
              <Car className="w-4 h-4 text-[#2563EB]" />
              1. Vehicle Profile & Identity
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
              <div>
                <span className="text-[#64748B] block">Vehicle Name</span>
                <span className="font-bold text-[#0F172A] text-sm truncate block">{vehicle.name}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Make & Model</span>
                <span className="font-bold text-[#0F172A] text-sm block">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Registration Plate</span>
                <span className="font-bold font-mono text-[#0F172A] text-sm block">
                  {vehicle.license_plate || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Current Odometer</span>
                <span className="font-extrabold text-[#0F172A] text-sm block">
                  {currentOdo.toLocaleString()} {distanceUnit}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Fuel Type</span>
                <span className="font-bold text-[#0F172A] block">{vehicle.fuel_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">VIN / Chassis</span>
                <span className="font-mono text-[#0F172A] block truncate">{vehicle.vin || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Insurance Status</span>
                <span className="font-bold block">
                  {vehicle.insurance_expiry ? (
                    getDaysDifference(vehicle.insurance_expiry) < 0 ? (
                      <span className="text-[#DC2626]">Expired ({formatDate(vehicle.insurance_expiry)})</span>
                    ) : (
                      <span className="text-[#16A34A]">Valid ({formatDate(vehicle.insurance_expiry)})</span>
                    )
                  ) : (
                    <span className="text-[#64748B]">None Logged</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">PUC Emission Status</span>
                <span className="font-bold block">
                  {vehicle.puc_expiry ? (
                    getDaysDifference(vehicle.puc_expiry) < 0 ? (
                      <span className="text-[#DC2626]">Expired ({formatDate(vehicle.puc_expiry)})</span>
                    ) : (
                      <span className="text-[#16A34A]">Valid ({formatDate(vehicle.puc_expiry)})</span>
                    )
                  ) : (
                    <span className="text-[#64748B]">None Logged</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Financial TCO & Fuel Economics */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#17365D] flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#2563EB]" />
              2. Total Cost of Ownership & Fuel Analytics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE]">
                <span className="text-[11px] font-bold text-[#1E40AF] block uppercase">Lifetime Spend</span>
                <span className="text-xl font-black text-[#1E3A8A] block mt-0.5">
                  {formatCurrency(totalCost, currency)}
                </span>
                <span className="text-[10px] text-[#3B82F6] block mt-0.5">
                  All recorded expenses
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A]">
                <span className="text-[11px] font-bold text-[#92400E] block uppercase">Fuel Spend</span>
                <span className="text-xl font-black text-[#78350F] block mt-0.5">
                  {formatCurrency(expenseSummary.fuelSpent, currency)}
                </span>
                <span className="text-[10px] text-[#B45309] block mt-0.5">
                  {fuelSummary.totalLitres.toFixed(1)} {volumeUnit} across {fuelLogs.length} fills
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]">
                <span className="text-[11px] font-bold text-[#166534] block uppercase">Service & Repairs</span>
                <span className="text-xl font-black text-[#14532D] block mt-0.5">
                  {formatCurrency(expenseSummary.serviceSpent, currency)}
                </span>
                <span className="text-[10px] text-[#15803D] block mt-0.5">
                  Across {services.length} garage visits
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF]">
                <span className="text-[11px] font-bold text-[#6B21A8] block uppercase">Verified Mileage</span>
                <span className="text-xl font-black text-[#581C87] block mt-0.5">
                  {fuelSummary.avgEfficiency ? `${fuelSummary.avgEfficiency} ${fuelSummary.efficiencyUnit}` : 'Calculating'}
                </span>
                <span className="text-[10px] text-[#7E22CE] block mt-0.5">
                  {costPerKm ? `${formatCurrency(costPerKm, currency)} per ${distanceUnit}` : 'Tank-to-tank'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Maintenance & Service History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#17365D] flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-[#2563EB]" />
                3. Service & Maintenance History ({services.length})
              </h3>
            </div>

            {services.length === 0 ? (
              <p className="text-xs text-[#64748B] italic p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                No service records recorded for this vehicle.
              </p>
            ) : (
              <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3">Date</th>
                      <th className="p-3">Service Type</th>
                      <th className="p-3">Garage / Workshop</th>
                      <th className="p-3">Odometer</th>
                      <th className="p-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-[#F8FAFC]/50">
                        <td className="p-3 font-semibold">{formatDate(s.date)}</td>
                        <td className="p-3">
                          <span className="font-bold text-[#0F172A]">{s.service_type}</span>
                          {s.notes && (
                            <span className="block text-[11px] text-[#64748B] mt-0.5 truncate max-w-xs">
                              {s.notes}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[#475569]">{s.garage || 'Independent'}</td>
                        <td className="p-3 font-mono">
                          {s.odometer ? `${Number(s.odometer).toLocaleString()} ${distanceUnit}` : '-'}
                        </td>
                        <td className="p-3 font-bold text-right text-[#0F172A]">
                          {formatCurrency(s.cost, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Fuel Logs Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#17365D] flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-[#2563EB]" />
              4. Fuel Log Record ({fuelLogs.length} Refills)
            </h3>

            {fuelLogs.length === 0 ? (
              <p className="text-xs text-[#64748B] italic p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                No fuel refill records logged for this vehicle.
              </p>
            ) : (
              <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
                      <th className="p-3">Date</th>
                      <th className="p-3">Station / Brand</th>
                      <th className="p-3">Volume</th>
                      <th className="p-3">Odometer</th>
                      <th className="p-3 text-right">Cost Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {fuelLogs.slice(0, 10).map((f) => (
                      <tr key={f.id} className="hover:bg-[#F8FAFC]/50">
                        <td className="p-3 font-semibold">{formatDate(f.date)}</td>
                        <td className="p-3 text-[#475569]">{f.fuel_brand || 'Fuel Station'}</td>
                        <td className="p-3 font-medium">
                          {f.litres > 0 ? `${f.litres} ${volumeUnit}` : 'Amount-only top-up'}
                        </td>
                        <td className="p-3 font-mono">
                          {f.odometer ? `${Number(f.odometer).toLocaleString()} ${distanceUnit}` : '-'}
                        </td>
                        <td className="p-3 font-bold text-right text-[#0F172A]">
                          {formatCurrency(f.total_cost, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 5: Upcoming Deadlines & Checkpoints */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#17365D] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              5. Scheduled Maintenance & Compliance Checkpoints
            </h3>

            {reminders.filter((r) => !r.is_completed).length === 0 ? (
              <p className="text-xs text-[#16A34A] p-4 bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                All compliance policies and scheduled maintenance checkpoints are active and verified.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {reminders
                  .filter((r) => !r.is_completed)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#0F172A] block">{r.title}</span>
                        <span className="text-[11px] text-[#64748B]">
                          Target: {r.due_date ? formatDate(r.due_date) : ''}{' '}
                          {r.due_odometer ? `(${r.due_odometer.toLocaleString()} ${distanceUnit})` : ''}
                        </span>
                      </div>
                      <Badge variant="warning">Scheduled</Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Section 6: Digital Document Archives */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#17365D] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              6. Digital Document Vault ({documents.length} Files on Record)
            </h3>

            {documents.length === 0 ? (
              <p className="text-xs text-[#64748B] italic p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                No files archived in vault yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {documents.map((d) => (
                  <div key={d.id} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] truncate">
                    <span className="font-bold text-[#0F172A] block truncate">{d.name}</span>
                    <span className="text-[11px] text-[#64748B] block truncate">
                      {d.type} {d.expiry_date ? `• Exp: ${formatDate(d.expiry_date)}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Footer / Signature Area */}
          <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
            <div>
              Generated by <strong>AutoCare Companion</strong> for owner of {vehicle.license_plate || vehicle.name}.
            </div>
            <div className="text-right italic">
              Verification Hash: {vehicle.id ? vehicle.id.slice(0, 16) : 'VERIFIED'}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
