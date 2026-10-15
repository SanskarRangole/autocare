import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getServices,
  createService,
  updateService,
  deleteService,
  uploadDocument,
  createReminder,
} from '../../lib/storage'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ServiceFormModal } from './ServiceFormModal'
import {
  Wrench,
  Plus,
  Calendar,
  Gauge,
  Building2,
  DollarSign,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../lib/utils'

export function ServiceList() {
  const { user, currency } = useAuth()
  const { activeVehicle, loadVehicles } = useVehicles()

  const [services, setServices] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [repeatSource, setRepeatSource] = useState(null)
  const [deletingService, setDeletingService] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    if (!activeVehicle) {
      setServices([])
      return
    }
    try {
      const data = await getServices(activeVehicle.id)
      setServices(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeVehicle?.id])

  const handleSaveService = async (serviceData, invoiceFile = null, autoReminder = null) => {
    if (!user || !activeVehicle) return
    if (editingService) {
      await updateService(editingService.id, serviceData)
    } else {
      await createService(user.id, activeVehicle.id, serviceData)

      if (invoiceFile) {
        try {
          await uploadDocument(user.id, activeVehicle.id, invoiceFile, {
            name: `Invoice: ${serviceData.service_type} (${serviceData.date})`,
            type: 'Service Invoice',
            notes: `Garage: ${serviceData.garage || 'N/A'} - Cost: ${serviceData.cost}`,
          })
        } catch (e) {
          console.warn('Failed to upload invoice document:', e)
        }
      }

      if (autoReminder) {
        try {
          await createReminder(user.id, activeVehicle.id, autoReminder)
        } catch (e) {
          console.warn('Failed to create service reminder:', e)
        }
      }
    }
    await loadData()
    if (loadVehicles) await loadVehicles()
  }

  const handleDeleteConfirm = async () => {
    if (!deletingService) return
    setIsDeleting(true)
    try {
      await deleteService(deletingService.id)
      setDeletingService(null)
      await loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!activeVehicle) {
    return (
      <EmptyState
        icon={Wrench}
        title="No vehicle selected"
        description="Please select or add a vehicle from your garage to view and record its service history."
      />
    )
  }

  const totalSpent = services.reduce((acc, s) => acc + (Number(s.cost) || 0), 0)
  const latestService = services[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Service History
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Maintenance logs, garage visits, and repair history for{' '}
            <span className="font-semibold text-[#0F172A]">{activeVehicle.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {latestService && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingService(null)
                setRepeatSource(latestService)
                setModalOpen(true)
              }}
              className="text-xs font-bold border-[#BFDBFE] text-[#1E40AF] bg-[#EFF6FF] hover:bg-[#DBEAFE]"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Repeat Last Service
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingService(null)
              setRepeatSource(null)
              setModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Service
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">
                Total Service Cost
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5 block">
                {formatCurrency(totalSpent, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#17365D] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">
                Services Performed
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5 block">
                {services.length} records
              </span>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF5FF] text-[#7C3AED] border border-[#E9D5FF] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">
                Latest Service Date
              </span>
              <span className="text-base sm:text-lg font-bold text-[#0F172A] mt-0.5 block">
                {latestService ? formatDate(latestService.date) : 'No records yet'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      {services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No service records yet"
          description={`Log scheduled maintenance, oil changes, or repair work for ${activeVehicle.name}. All service expenses automatically sync to your spending analytics.`}
          actionLabel="Log First Service"
          onAction={() => {
            setEditingService(null)
            setModalOpen(true)
          }}
        />
      ) : (
        <div className="space-y-3.5">
          {services.map((s) => (
            <Card key={s.id} className="hover:border-[#CBD5E1] transition-all">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#0F172A]">{s.service_type}</h3>
                      <Badge variant="primary">{formatDate(s.date)}</Badge>
                      {s.odometer && (
                        <Badge variant="neutral">
                          <Gauge className="w-3 h-3 mr-1 inline" />
                          {Number(s.odometer).toLocaleString()} km
                        </Badge>
                      )}
                    </div>

                    {s.garage && (
                      <p className="text-xs sm:text-sm text-[#475569] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#94A3B8]" />
                        <span>{s.garage}</span>
                      </p>
                    )}

                    {s.notes && (
                      <p className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mt-2 leading-relaxed">
                        {s.notes}
                      </p>
                    )}

                    {(s.next_due_date || s.next_due_odometer) && (
                      <div className="text-xs text-[#2563EB] font-semibold pt-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Next due checkpoint:</span>
                        {s.next_due_date && <span>{formatDate(s.next_due_date)}</span>}
                        {s.next_due_odometer && (
                          <span>or at {Number(s.next_due_odometer).toLocaleString()} km</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9] shrink-0">
                    <div className="text-lg font-extrabold text-[#0F172A]">
                      {formatCurrency(s.cost, currency)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingService(null)
                          setRepeatSource(s)
                          setModalOpen(true)
                        }}
                        className="text-xs font-bold text-[#1E40AF] bg-[#EFF6FF] border-[#BFDBFE] hover:bg-[#DBEAFE] h-8 px-2.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Repeat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRepeatSource(null)
                          setEditingService(s)
                          setModalOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-[#64748B]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#DC2626] hover:text-[#991B1B] hover:bg-[#FEF2F2]"
                        onClick={() => setDeletingService(s)}
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

      {/* Service Modal */}
      <ServiceFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingService(null)
          setRepeatSource(null)
        }}
        onSave={handleSaveService}
        service={editingService}
        repeatSource={repeatSource}
        currentOdometer={activeVehicle.current_odometer}
        vehicle={activeVehicle}
        pastGarages={services.map((s) => s.garage).filter(Boolean)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingService)}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service Record?"
        description="This will permanently delete this service record and remove its synchronized expense entry."
        loading={isDeleting}
      />
    </div>
  )
}
