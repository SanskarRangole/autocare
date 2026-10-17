import React, { useState } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { EmptyState } from '../ui/EmptyState'
import {
  Car,
  Bike,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Gauge,
  Sparkles,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Fuel,
  TrendingUp,
} from 'lucide-react'
import { getDaysDifference, formatDate } from '../../lib/utils'

export function VehicleList({ onOpenAddModal, onEditVehicle, onNavigate }) {
  const { vehicles, activeVehicleId, selectVehicle, deleteVehicle, seedDemoData } = useVehicles()
  const [vehicleToDelete, setVehicleToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return
    setDeleting(true)
    try {
      await deleteVehicle(vehicleToDelete.id)
      setVehicleToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Garage & Vehicles
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Manage your personal fleet of cars, motorcycles, and scooters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {vehicles.length > 1 && onNavigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('expenses', 'comparison')}
              className="text-[#17365D] border-[#CBD5E1] bg-white hover:bg-[#F8FAFC]"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
              Compare Expenses
            </Button>
          )}
          {vehicles.length === 0 && (
            <Button variant="outline" size="sm" onClick={seedDemoData}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
              Load Sample Fleet
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onOpenAddModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Your garage is empty"
          description="Register your first vehicle to start tracking services, fuel mileage, documents, and maintenance alerts."
          actionLabel="Add Vehicle"
          onAction={onOpenAddModal}
          secondaryActionLabel="Seed Sample Fleet"
          onSecondaryAction={seedDemoData}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => {
            const isActive = v.id === activeVehicleId
            const isMoto = v.type === 'motorcycle' || v.type === 'scooter'
            const insuranceDays = getDaysDifference(v.insurance_expiry)
            const pucDays = getDaysDifference(v.puc_expiry)

            return (
              <Card
                key={v.id}
                className={`overflow-hidden transition-all duration-200 relative ${
                  isActive
                    ? 'border-[#2563EB] shadow-[0_10px_25px_-3px_rgba(37,99,235,0.08),0_4px_6px_-4px_rgba(37,99,235,0.04)] ring-1 ring-[#2563EB]'
                    : 'hover:border-[#CBD5E1] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.06)]'
                }`}
              >
                {/* Active Indicator Top Strip */}
                {isActive && (
                  <div className="bg-[#17365D] text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" /> Active in Focus
                    </span>
                    <span className="text-[10px] text-slate-300 uppercase tracking-wider">
                      Selected
                    </span>
                  </div>
                )}

                <CardContent className="p-6 space-y-4">
                  {/* Top: Icon & Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#17365D] border border-[#DBEAFE] flex items-center justify-center shrink-0 shadow-xs">
                        {isMoto ? <Bike className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#0F172A] leading-snug truncate">
                          {v.name}
                        </h3>
                        <p className="text-xs text-[#64748B] truncate mt-0.5">
                          {v.year} {v.make} {v.model}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isActive ? 'primary' : 'neutral'}>
                      {v.type?.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                        Odometer
                      </span>
                      <span className="text-sm font-extrabold text-[#0F172A] mt-0.5 block">
                        {Number(v.current_odometer || 0).toLocaleString()} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                        Fuel Type
                      </span>
                      <span className="text-sm font-semibold text-[#334155] mt-0.5 block">
                        {v.fuel_type || 'Petrol'}
                      </span>
                    </div>
                  </div>

                  {/* Plate & VIN */}
                  <div className="space-y-1.5 text-xs text-[#475569]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B]">License Plate:</span>
                      <span className="font-mono font-bold text-[#0F172A]">
                        {v.license_plate || 'Not recorded'}
                      </span>
                    </div>
                    {v.vin && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">VIN:</span>
                        <span className="font-mono text-[11px] text-[#475569] truncate max-w-[150px]">
                          {v.vin}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compliance Status Badges */}
                  <div className="pt-2 border-t border-[#F1F5F9] flex flex-wrap gap-2">
                    {v.insurance_expiry ? (
                      insuranceDays !== null && insuranceDays < 0 ? (
                        <Badge variant="danger">Insurance Expired</Badge>
                      ) : insuranceDays !== null && insuranceDays <= 30 ? (
                        <Badge variant="warning">Ins. due in {insuranceDays}d</Badge>
                      ) : (
                        <Badge variant="success">Insurance Valid</Badge>
                      )
                    ) : (
                      <Badge variant="neutral">No Insurance logged</Badge>
                    )}

                    {v.puc_expiry && (
                      pucDays !== null && pucDays < 0 ? (
                        <Badge variant="danger">PUC Expired</Badge>
                      ) : pucDays !== null && pucDays <= 15 ? (
                        <Badge variant="warning">PUC due {pucDays}d</Badge>
                      ) : (
                        <Badge variant="success">PUC Valid</Badge>
                      )
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
                    {!isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold"
                        onClick={() => selectVehicle(v.id)}
                      >
                        Select Vehicle
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-[#059669] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Active Vehicle
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditVehicle(v)}
                        title="Edit vehicle details"
                      >
                        <Edit2 className="w-4 h-4 text-[#64748B]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVehicleToDelete(v)}
                        title="Delete vehicle"
                        className="text-[#DC2626] hover:text-[#991B1B] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(vehicleToDelete)}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${vehicleToDelete?.name}?`}
        description="This will permanently delete this vehicle and all associated service history, fuel records, expenses, reminders, and documents. This cannot be undone."
        loading={deleting}
      />
    </div>
  )
}
