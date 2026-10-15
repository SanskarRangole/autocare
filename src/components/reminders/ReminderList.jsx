import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getReminders,
  createReminder,
  updateReminder,
  toggleReminderStatus,
  deleteReminder,
} from '../../lib/storage'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ReminderFormModal } from './ReminderFormModal'
import { DocumentRenewalModal } from '../documents/DocumentRenewalModal'
import {
  BellRing,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Gauge,
  Edit2,
  Trash2,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { formatDate, getDaysDifference } from '../../lib/utils'

export function ReminderList() {
  const { user } = useAuth()
  const { activeVehicle, loadVehicles } = useVehicles()

  const [reminders, setReminders] = useState([])
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'completed'
  const [modalOpen, setModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [renewalModalOpen, setRenewalModalOpen] = useState(false)
  const [renewalDocType, setRenewalDocType] = useState('Insurance Policy')
  const [deletingReminder, setDeletingReminder] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    if (!activeVehicle) {
      setReminders([])
      return
    }
    try {
      const data = await getReminders(activeVehicle.id)
      setReminders(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeVehicle?.id])

  const handleToggle = async (reminder) => {
    await toggleReminderStatus(reminder.id, !reminder.is_completed)
    await loadData()
  }

  const handleSaveReminder = async (data) => {
    if (!user || !activeVehicle) return
    if (editingReminder) {
      await updateReminder(editingReminder.id, data)
    } else {
      await createReminder(user.id, activeVehicle.id, data)
    }
    await loadData()
  }

  const handleDeleteConfirm = async () => {
    if (!deletingReminder) return
    setIsDeleting(true)
    try {
      await deleteReminder(deletingReminder.id)
      setDeletingReminder(null)
      await loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!activeVehicle) {
    return (
      <EmptyState
        icon={BellRing}
        title="No vehicle selected"
        description="Select a vehicle to view and manage upcoming service, insurance and PUC reminders."
      />
    )
  }

  const activeReminders = reminders.filter((r) => !r.is_completed)
  const completedReminders = reminders.filter((r) => r.is_completed)
  const currentList = activeTab === 'active' ? activeReminders : completedReminders

  // Intelligent rule-based reminders detected from vehicle compliance dates
  const suggestedReminders = []
  if (activeVehicle?.insurance_expiry) {
    const exists = reminders.some(
      (r) => r.category === 'insurance' || r.due_date === activeVehicle.insurance_expiry
    )
    if (!exists) {
      suggestedReminders.push({
        id: 'sugg-insurance',
        title: 'Insurance Policy Renewal',
        category: 'insurance',
        due_date: activeVehicle.insurance_expiry,
        notes: `Policy #${activeVehicle.insurance_policy_no || 'N/A'} (${activeVehicle.insurance_provider || 'Provider'})`,
      })
    }
  }

  if (activeVehicle?.puc_expiry) {
    const exists = reminders.some(
      (r) => r.category === 'puc' || r.due_date === activeVehicle.puc_expiry
    )
    if (!exists) {
      suggestedReminders.push({
        id: 'sugg-puc',
        title: 'PUC / Emission Inspection',
        category: 'puc',
        due_date: activeVehicle.puc_expiry,
        notes: `Certificate #${activeVehicle.puc_number || 'N/A'}`,
      })
    }
  }

  const handleAddSuggestedReminder = async (sugg) => {
    if (!user || !activeVehicle) return
    await createReminder(user.id, activeVehicle.id, {
      title: sugg.title,
      category: sugg.category,
      due_date: sugg.due_date,
      notes: sugg.notes,
    })
    await loadData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Reminders & Schedules
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Keep track of upcoming service milestones, insurance renewals, and PUC inspections for{' '}
            <span className="font-semibold text-[#0F172A]">{activeVehicle.name}</span>.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingReminder(null)
            setModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Set Reminder
        </Button>
      </div>

      {/* Smart Suggestions from Vehicle Compliance Records */}
      {activeTab === 'active' && suggestedReminders.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#F8FAFC] border border-[#BFDBFE] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E40AF]">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>Smart Suggestions from Vehicle Records ({suggestedReminders.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedReminders.map((sugg) => (
              <div
                key={sugg.id}
                className="p-3 bg-white rounded-xl border border-[#DBEAFE] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-bold text-[#0F172A] truncate">{sugg.title}</div>
                  <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#2563EB]" />
                    <span>Due: {formatDate(sugg.due_date)}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSuggestedReminder(sugg)}
                  className="text-xs shrink-0 font-semibold"
                >
                  <Plus className="w-3 h-3 mr-1" /> Track
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modern Filter Tabs */}
      <div className="flex p-1 bg-[#F1F5F9] rounded-2xl max-w-xs border border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'active'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Active ({activeReminders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Completed ({completedReminders.length})
        </button>
      </div>

      {/* Reminders List */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title={activeTab === 'active' ? 'No active reminders' : 'No completed reminders yet'}
          description={
            activeTab === 'active'
              ? `You're all caught up! Create a reminder for ${activeVehicle.name}'s next oil change, insurance policy renewal, or emission test.`
              : 'Completed maintenance checkpoints will appear here once marked done.'
          }
          actionLabel={activeTab === 'active' ? 'Set Reminder' : undefined}
          onAction={
            activeTab === 'active'
              ? () => {
                  setEditingReminder(null)
                  setModalOpen(true)
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3.5">
          {currentList.map((r) => {
            const daysLeft = getDaysDifference(r.due_date)
            const remainingKm =
              r.due_odometer && activeVehicle.current_odometer
                ? Number(r.due_odometer) - Number(activeVehicle.current_odometer)
                : null

            const isDateOverdue = daysLeft !== null && daysLeft < 0
            const isDateDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14
            const isKmOverdue = remainingKm !== null && remainingKm <= 0
            const isKmDueSoon = remainingKm !== null && remainingKm > 0 && remainingKm <= 500

            const isUrgent = (isDateOverdue || isKmOverdue) && !r.is_completed
            const isWarning = (isDateDueSoon || isKmDueSoon) && !isUrgent && !r.is_completed

            return (
              <Card
                key={r.id}
                className={`transition-all duration-150 ${
                  isUrgent
                    ? 'border-[#FECACA] bg-[#FEF2F2]/40'
                    : isWarning
                    ? 'border-[#FDE68A] bg-[#FFFBEB]/40'
                    : 'hover:border-[#CBD5E1]'
                }`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggle(r)}
                      className="mt-1 rounded-xl text-[#94A3B8] hover:text-[#2563EB] transition-colors shrink-0"
                      title={r.is_completed ? 'Mark as active' : 'Mark as completed'}
                    >
                      {r.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#CBD5E1] hover:text-[#64748B]" />
                      )}
                    </button>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-base font-bold tracking-tight ${
                            r.is_completed ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'
                          }`}
                        >
                          {r.title}
                        </h3>
                        <Badge variant="neutral">{r.category?.toUpperCase()}</Badge>

                        {/* Status Alerts */}
                        {!r.is_completed && (
                          <>
                            {isDateOverdue && (
                              <Badge variant="danger">
                                Overdue by {Math.abs(daysLeft)} day{Math.abs(daysLeft) === 1 ? '' : 's'}
                              </Badge>
                            )}
                            {isDateDueSoon && (
                              <Badge variant="warning">
                                Due in {daysLeft} day{daysLeft === 1 ? '' : 's'}
                              </Badge>
                            )}
                            {isKmOverdue && (
                              <Badge variant="danger">
                                Overdue by {Math.abs(remainingKm).toLocaleString()} km
                              </Badge>
                            )}
                            {isKmDueSoon && (
                              <Badge variant="warning">
                                Due in {remainingKm.toLocaleString()} km
                              </Badge>
                            )}
                          </>
                        )}

                        {r.is_completed && (
                          <Badge variant="success">
                            Completed {r.completed_date ? formatDate(r.completed_date) : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Due Details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#475569]">
                        {r.due_date && (
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4 text-[#94A3B8]" />
                            Target Date: <strong className="text-[#0F172A]">{formatDate(r.due_date)}</strong>
                          </span>
                        )}

                        {r.due_odometer && (
                          <span className="flex items-center gap-1.5 font-medium">
                            <Gauge className="w-4 h-4 text-[#94A3B8]" />
                            Target Odometer: <strong className="text-[#0F172A]">{Number(r.due_odometer).toLocaleString()} km</strong>
                            {remainingKm !== null && !r.is_completed && (
                              <span className="text-[#64748B]">
                                ({remainingKm > 0 ? `${remainingKm.toLocaleString()} km left` : 'passed'})
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {r.notes && (
                        <p className="text-xs text-[#475569] bg-white/90 p-3 rounded-xl border border-[#E2E8F0] mt-2">
                          {r.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!r.is_completed &&
                        (r.title.toLowerCase().includes('insurance') ||
                          r.title.toLowerCase().includes('puc') ||
                          r.type === 'Insurance' ||
                          r.type === 'PUC') && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs font-bold px-2.5 h-8 shadow-xs"
                            onClick={() => {
                              setRenewalDocType(
                                r.title.toLowerCase().includes('puc') || r.type === 'PUC'
                                  ? 'Pollution Certificate (PUC)'
                                  : 'Insurance Policy'
                              )
                              setRenewalModalOpen(true)
                            }}
                          >
                            Renew
                          </Button>
                        )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReminder(r)
                          setModalOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-[#64748B]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#DC2626] hover:text-[#991B1B] hover:bg-[#FEF2F2]"
                        onClick={() => setDeletingReminder(r)}
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

      {/* Reminder Modal */}
      <ReminderFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingReminder(null)
        }}
        onSave={handleSaveReminder}
        reminder={editingReminder}
        currentOdometer={activeVehicle.current_odometer}
      />

      {/* Document Renewal Modal */}
      <DocumentRenewalModal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        docType={renewalDocType}
        vehicle={activeVehicle}
        userId={user?.id}
        onSuccess={async () => {
          await loadVehicles()
          await loadData()
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingReminder)}
        onClose={() => setDeletingReminder(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Reminder?"
        description="This will permanently delete this reminder checkpoint."
        loading={isDeleting}
      />
    </div>
  )
}
