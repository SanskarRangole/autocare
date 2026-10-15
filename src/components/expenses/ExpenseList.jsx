import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../lib/storage'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ExpenseFormModal } from './ExpenseFormModal'
import { ExpenseCharts } from './ExpenseCharts'
import {
  Receipt,
  Plus,
  DollarSign,
  Tag,
  Edit2,
  Trash2,
  Fuel,
  Wrench,
  ShieldCheck,
} from 'lucide-react'
import { formatCurrency, formatDate, calculateExpenseSummary } from '../../lib/utils'

export function ExpenseList() {
  const { user, currency } = useAuth()
  const { activeVehicle } = useVehicles()

  const [expenses, setExpenses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [preset, setPreset] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleQuickRepeat = (p) => {
    setEditingExpense(null)
    setPreset(p)
    setModalOpen(true)
  }

  const loadData = async () => {
    if (!activeVehicle) {
      setExpenses([])
      return
    }
    try {
      const data = await getExpenses(activeVehicle.id)
      setExpenses(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeVehicle?.id])

  const handleSaveExpense = async (data) => {
    if (!user || !activeVehicle) return
    if (editingExpense) {
      await updateExpense(editingExpense.id, data)
    } else {
      await createExpense(user.id, activeVehicle.id, data)
    }
    await loadData()
  }

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return
    setIsDeleting(true)
    try {
      await deleteExpense(deletingExpense.id)
      setDeletingExpense(null)
      await loadData()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!activeVehicle) {
    return (
      <EmptyState
        icon={Receipt}
        title="No vehicle selected"
        description="Select a vehicle from your garage to review spending breakdowns and expense analytics."
      />
    )
  }

  const summary = calculateExpenseSummary(expenses)
  const topCategory = summary.categoryChartData[0]?.name || '-'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Expenses & Spending
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Complete cost of ownership ledger and categorical analytics for{' '}
            <span className="font-semibold text-[#0F172A]">{activeVehicle.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingExpense(null)
              setPreset(null)
              setModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* 1-Tap Quick Expense Shortcuts */}
      <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#17365D] uppercase tracking-wider mr-1">
          1-Tap Quick Log:
        </span>
        {[
          { label: '🅿️ Parking', category: 'Tolls & Parking', description: 'Parking Fee' },
          { label: '🛣️ Highway Toll', category: 'Tolls & Parking', description: 'FASTag / Toll' },
          { label: '🧼 Car Wash', category: 'Wash & Detailing', description: 'Car Wash & Detailing' },
          { label: '🛠️ Accessories', category: 'Parts & Accessories', description: 'Vehicle Accessories' },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handleQuickRepeat(p)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#1E40AF] transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">
                Total Recorded Spend
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5 block">
                {formatCurrency(summary.totalSpent, currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#17365D] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">
                Largest Cost Category
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#0F172A] truncate block max-w-[180px] mt-0.5">
                {topCategory}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">
                Total Expense Records
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5 block">
                {expenses.length} entries
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <ExpenseCharts summary={summary} currency={currency} />

      {/* Expense History List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
            Expense Records
          </h2>
          <span className="text-xs text-[#64748B]">All entries</span>
        </div>

        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses logged yet"
            description={`Log your tolls, parking fees, insurance premiums, detailing, and accessories for ${activeVehicle.name}.`}
            actionLabel="Add Expense"
            onAction={() => {
              setEditingExpense(null)
              setModalOpen(true)
            }}
          />
        ) : (
          <div className="space-y-3">
            {expenses.map((e) => (
              <Card key={e.id} className="hover:border-[#CBD5E1] transition-all">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#475569]">
                      {e.category === 'Fuel' ? (
                        <Fuel className="w-4 h-4 text-[#D97706]" />
                      ) : e.category === 'Service' ? (
                        <Wrench className="w-4 h-4 text-[#2563EB]" />
                      ) : e.category === 'Insurance' ? (
                        <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                      ) : (
                        <Receipt className="w-4 h-4 text-[#059669]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A] truncate">
                          {e.description || e.category}
                        </span>
                        <Badge variant="neutral" className="text-[11px] shrink-0">
                          {e.category}
                        </Badge>
                        {e.reference_type && e.reference_type !== 'standalone' && (
                          <span className="text-[11px] text-[#64748B] hidden sm:inline">
                            (Auto-synced from {e.reference_type})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#64748B] mt-0.5">{formatDate(e.date)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0">
                    <div className="text-base sm:text-lg font-extrabold text-[#0F172A]">
                      {formatCurrency(e.amount, currency)}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingExpense(e)
                          setModalOpen(true)
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-[#64748B]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#DC2626] hover:text-[#991B1B] hover:bg-[#FEF2F2]"
                        onClick={() => setDeletingExpense(e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <ExpenseFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingExpense(null)
          setPreset(null)
        }}
        onSave={handleSaveExpense}
        expense={editingExpense}
        initialPreset={preset}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Entry?"
        description="This will permanently delete this expense record from your accounting."
        loading={isDeleting}
      />
    </div>
  )
}
