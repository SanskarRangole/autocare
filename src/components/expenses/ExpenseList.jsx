import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getExpenses,
  getAllExpenses,
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
import { VehicleExpenseComparison } from './VehicleExpenseComparison'
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
  TrendingUp,
  Trophy,
  Layers,
} from 'lucide-react'
import { formatCurrency, formatDate, calculateExpenseSummary } from '../../lib/utils'

export function ExpenseList({ initialTab = 'ledger', onOpenAddVehicleModal = () => {} }) {
  const { user, currency } = useAuth()
  const { vehicles, activeVehicle, selectVehicle, seedDemoData } = useVehicles()

  const [currentView, setCurrentView] = useState(initialTab)
  const [expenses, setExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [preset, setPreset] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync initialTab if changed externally
  useEffect(() => {
    if (initialTab) {
      setCurrentView(initialTab)
    }
  }, [initialTab])

  const handleQuickRepeat = (p) => {
    setEditingExpense(null)
    setPreset(p)
    setModalOpen(true)
  }

  const loadData = async () => {
    try {
      if (activeVehicle) {
        const data = await getExpenses(activeVehicle.id)
        setExpenses(data)
      } else {
        setExpenses([])
      }

      if (user) {
        const all = await getAllExpenses(user.id)
        setAllExpenses(all)
      } else {
        setAllExpenses([])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeVehicle?.id, user?.id])

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
            {currentView === 'comparison'
              ? 'Multi-vehicle expense comparison, cost drivers, and fleet rankings.'
              : activeVehicle
              ? `Complete cost of ownership ledger and categorical analytics for ${activeVehicle.name}.`
              : 'Select a vehicle or compare fleet expenses.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeVehicle && (
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
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-6">
        <button
          type="button"
          onClick={() => setCurrentView('ledger')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            currentView === 'ledger'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Active Vehicle Ledger</span>
          {activeVehicle && (
            <span className="text-xs font-normal text-[#64748B] hidden sm:inline">
              ({activeVehicle.name})
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('comparison')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            currentView === 'comparison'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Compare Multiple Vehicles</span>
          <Badge variant="primary" className="text-[10px] px-1.5 py-0 font-extrabold">
            {vehicles.length} {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
          </Badge>
        </button>
      </div>

      {/* VIEW: COMPARISON */}
      {currentView === 'comparison' && (
        <VehicleExpenseComparison
          vehicles={vehicles}
          allExpenses={allExpenses}
          currency={currency}
          activeVehicleId={activeVehicle?.id}
          onSelectVehicle={selectVehicle}
          onOpenAddVehicle={onOpenAddVehicleModal}
          onSeedDemoData={seedDemoData}
        />
      )}

      {/* VIEW: ACTIVE VEHICLE LEDGER */}
      {currentView === 'ledger' && !activeVehicle && (
        <EmptyState
          icon={Receipt}
          title="No vehicle selected"
          description="Select a vehicle from your garage to review spending breakdowns and expense analytics."
        />
      )}

      {currentView === 'ledger' && activeVehicle && (
        <div className="space-y-6">
          {/* Multi-vehicle hint banner */}
          {vehicles.length > 1 && (
            <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-between gap-3 text-xs text-[#1E40AF]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>
                  Curious which vehicle in your garage incurs more expenses? Compare {vehicles.length} vehicles side-by-side.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('comparison')}
                className="font-bold underline hover:text-[#172554] shrink-0"
              >
                Compare Fleet Expenses →
              </button>
            </div>
          )}

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
      </div>
      )}

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
