import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
} from '../../lib/storage'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { FuelFormModal } from './FuelFormModal'
import {
  Fuel,
  Plus,
  Gauge,
  TrendingUp,
  Droplets,
  DollarSign,
  Edit2,
  Trash2,
  Info,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  calculateFuelLogMetrics,
  calculateFuelSummary,
} from '../../lib/utils'

export function FuelLogList() {
  const { user, currency, distanceUnit, volumeUnit } = useAuth()
  const { activeVehicle } = useVehicles()

  const [fuelLogs, setFuelLogs] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [deletingLog, setDeletingLog] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    if (!activeVehicle) {
      setFuelLogs([])
      return
    }
    try {
      const data = await getFuelLogs(activeVehicle.id)
      setFuelLogs(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeVehicle?.id])

  const [recentlyCreatedId, setRecentlyCreatedId] = useState(null)
  const [undoToast, setUndoToast] = useState(null)

  const handleSaveFuel = async (logData) => {
    if (!user || !activeVehicle) return
    if (editingLog) {
      await updateFuelLog(editingLog.id, logData)
    } else {
      const created = await createFuelLog(user.id, activeVehicle.id, logData)
      if (created?.id) {
        setRecentlyCreatedId(created.id)
        setUndoToast(`Fuel refill recorded for ${activeVehicle.name}.`)
        setTimeout(() => setUndoToast(null), 7000)
      }
    }
    await loadData()
  }

  const handleUndo = async () => {
    if (!recentlyCreatedId) return
    try {
      await deleteFuelLog(recentlyCreatedId)
      setRecentlyCreatedId(null)
      setUndoToast(null)
      await loadData()
    } catch (e) {
      console.error('Failed to undo fuel log:', e)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingLog) return
    setIsDeleting(true)
    try {
      await deleteFuelLog(deletingLog.id)
      setDeletingLog(null)
      await loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!activeVehicle) {
    return (
      <EmptyState
        icon={Fuel}
        title="No vehicle selected"
        description="Please select or register a vehicle to view and log fuel fill-ups."
      />
    )
  }

  const summary = calculateFuelSummary(fuelLogs, distanceUnit, volumeUnit)
  const enrichedLogs = calculateFuelLogMetrics(fuelLogs, distanceUnit, volumeUnit).reverse()

  return (
    <div className="space-y-6">
      {/* Undo Banner */}
      {undoToast && (
        <div className="p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-300">
          <span className="text-xs font-semibold text-[#1E40AF] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            {undoToast}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-xs font-bold text-[#DC2626] hover:underline px-2 py-0.5"
          >
            Undo
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Fuel & Mileage
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Log fill-ups, calculate exact fuel economy, and monitor fuel expenses for{' '}
            <span className="font-semibold text-[#0F172A]">{activeVehicle.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {fuelLogs.length > 0 && Number(fuelLogs[0]?.total_cost) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingLog(null)
                setModalOpen(true)
              }}
              className="text-xs font-bold border-[#BFDBFE] text-[#1E40AF] bg-[#EFF6FF] hover:bg-[#DBEAFE]"
            >
              Repeat Fill ({formatCurrency(fuelLogs[0].total_cost, currency)})
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingLog(null)
              setModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Quick Fuel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Avg Fuel Economy
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight block truncate">
                {summary.avgEfficiency ? `${summary.avgEfficiency} ${summary.efficiencyUnit}` : 'Calculating'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Total Fuel Spend
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight block">
                {formatCurrency(summary.totalSpent, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0">
              <Droplets className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Total Fuel Volume
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight block truncate">
                {summary.totalLitres} L
              </span>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF5FF] text-[#7C3AED] border border-[#E9D5FF] flex items-center justify-center shrink-0">
              <Gauge className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Fuel Cost / Distance
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight block truncate">
                {summary.avgCostPerDistance ? `${formatCurrency(summary.avgCostPerDistance, currency)} / km` : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info notice about calculation */}
      {fuelLogs.length < 2 && (
        <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-start gap-3.5 text-[#1E40AF] text-xs sm:text-sm">
          <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-bold">How fuel economy is computed:</strong> AutoCare uses the
            industry-standard full-tank method. When you log two consecutive full fill-ups, the app
            automatically computes your exact distance driven per unit of fuel (`km/L` or `MPG`).
          </p>
        </div>
      )}

      {/* Fuel Logs List */}
      {enrichedLogs.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title="No fuel entries recorded"
          description={`Log your gas station fill-ups for ${activeVehicle.name}. All fuel expenses automatically synchronize with your overall budget.`}
          actionLabel="Log First Refill"
          onAction={() => {
            setEditingLog(null)
            setModalOpen(true)
          }}
        />
      ) : (
        <div className="space-y-3.5">
          {enrichedLogs.map((log) => (
            <Card key={log.id} className="hover:border-[#CBD5E1] transition-all">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">{formatDate(log.date)}</Badge>
                      <Badge variant="neutral">
                        <Gauge className="w-3.5 h-3.5 mr-1 inline" />
                        {Number(log.odometer).toLocaleString()} km
                      </Badge>
                      {log.is_full_tank && <Badge variant="success">Full Tank</Badge>}
                      {log.fuel_brand && <Badge variant="neutral">{log.fuel_brand}</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#475569] pt-1">
                      <span>
                        <strong className="text-[#0F172A] font-bold">{log.litres} L</strong> filled
                      </span>
                      <span>
                        @ <strong className="text-[#0F172A] font-bold">{formatCurrency(log.price_per_litre || (log.total_cost / log.litres), currency)}/L</strong>
                      </span>
                    </div>

                    {/* Calculated Mileage Delta */}
                    {log.isCalculated && log.efficiency ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold mt-1">
                        <TrendingUp className="w-4 h-4 text-[#059669]" />
                        <span>
                          {log.efficiency} {log.unitLabel}
                        </span>
                        <span className="text-[11px] font-normal text-[#047857]">
                          (+{log.distanceDelta?.toLocaleString()} km driven)
                        </span>
                      </div>
                    ) : log.missed_previous_fill ? (
                      <p className="text-xs text-[#D97706] font-medium">
                        Missed previous fill flagged (mileage skipped to avoid skew)
                      </p>
                    ) : null}

                    {log.notes && (
                      <p className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mt-2">
                        {log.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9] shrink-0">
                    <div className="text-lg font-extrabold text-[#0F172A]">
                      {formatCurrency(log.total_cost, currency)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingLog(log)
                          setModalOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-[#64748B]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#DC2626] hover:text-[#991B1B] hover:bg-[#FEF2F2]"
                        onClick={() => setDeletingLog(log)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Fuel Modal */}
      <FuelFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingLog(null)
        }}
        onSave={handleSaveFuel}
        fuelLog={editingLog}
        currentOdometer={activeVehicle.current_odometer}
        vehicle={activeVehicle}
        previousLog={fuelLogs[0] || null}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingLog)}
        onClose={() => setDeletingLog(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Fuel Record?"
        description="This will permanently delete this fuel log and remove its synchronized expense record."
        loading={isDeleting}
      />
    </div>
  )
}
