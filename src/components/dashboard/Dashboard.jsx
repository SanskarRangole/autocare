import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getServices,
  getFuelLogs,
  getReminders,
  getExpenses,
  getDocuments,
  getVehicleTimeline,
  createFuelLog,
  createService,
  createExpense,
  uploadDocument,
} from '../../lib/storage'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  Car,
  Bike,
  Plus,
  AlertTriangle,
  Gauge,
  TrendingUp,
  DollarSign,
  Wrench,
  Fuel,
  Receipt,
  BellRing,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  FileUp,
  RotateCcw,
  Camera,
  ClipboardCheck,
  Calendar,
  Zap,
  Printer,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  calculateFuelSummary,
  calculateExpenseSummary,
  getDaysDifference,
} from '../../lib/utils'

// Modals
import { ReceiptCaptureModal } from '../receipts/ReceiptCaptureModal'
import { DocumentRenewalModal } from '../documents/DocumentRenewalModal'
import { BeforeYouServiceModal } from '../services/BeforeYouServiceModal'
import { VehicleReportModal } from '../vehicles/VehicleReportModal'

export function Dashboard({ onNavigate, onQuickAction, onOpenAddVehicleModal }) {
  const { user, currency, distanceUnit, volumeUnit } = useAuth()
  const { vehicles, activeVehicle, seedDemoData, loadVehicles } = useVehicles()

  const [services, setServices] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [reminders, setReminders] = useState([])
  const [expenses, setExpenses] = useState([])
  const [documents, setDocuments] = useState([])
  const [timeline, setTimeline] = useState([])

  // Modal triggers
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [renewalModalOpen, setRenewalModalOpen] = useState(false)
  const [renewalDocType, setRenewalDocType] = useState('Insurance Policy')
  const [beforeServiceModalOpen, setBeforeServiceModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const fetchDashboardData = async () => {
    if (!activeVehicle) {
      setServices([])
      setFuelLogs([])
      setReminders([])
      setExpenses([])
      setDocuments([])
      setTimeline([])
      return
    }

    try {
      const [srv, fuel, rem, exp, docs, tl] = await Promise.all([
        getServices(activeVehicle.id),
        getFuelLogs(activeVehicle.id),
        getReminders(activeVehicle.id),
        getExpenses(activeVehicle.id),
        getDocuments(activeVehicle.id),
        getVehicleTimeline(activeVehicle.id),
      ])
      setServices(srv)
      setFuelLogs(fuel)
      setReminders(rem)
      setExpenses(exp)
      setDocuments(docs)
      setTimeline(tl)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [activeVehicle?.id])

  // =========================================================================
  // 1. EMPTY STATE (When no vehicles exist yet)
  // =========================================================================
  if (vehicles.length === 0) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto py-4">
        <div className="relative bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-12 text-center shadow-xs overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center mb-6 shadow-xs">
            <Car className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Welcome to AutoCare
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] max-w-lg mx-auto mt-3 mb-8 leading-relaxed">
            Your personal companion for maintenance schedules, fuel economy, compliance deadlines,
            and cost of ownership.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Button variant="primary" size="lg" onClick={onOpenAddVehicleModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Vehicle
            </Button>
            <Button variant="outline" size="lg" onClick={seedDemoData}>
              <Sparkles className="w-4 h-4 mr-2 text-[#2563EB]" />
              Load Sample Fleet
            </Button>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Service & Repairs</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Log garage visits, parts replaced, and future maintenance checkpoints with 1-tap repeats.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center mb-3">
                <Fuel className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Quick Fuel</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Record fuel in seconds with quick amount chips and genuine tank-to-tank mileage math.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center mb-3">
                <BellRing className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Smart Reminders</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Automatic rule-based reminders generated before insurance, emission, or service limits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Document Vault</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Secure digital storage for RC cards, insurance PDFs, invoices, and 1-click renewals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!activeVehicle) return null

  // Summaries & Calculations
  const fuelSummary = calculateFuelSummary(fuelLogs, distanceUnit, volumeUnit)
  const expenseSummary = calculateExpenseSummary(expenses)
  const latestService = services[0] || null
  const latestFuel = fuelLogs[0] || null

  // Monthly Vehicle Digest telemetry
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth()
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1
  const prevMonthYear = curMonth === 0 ? curYear - 1 : curYear

  const curMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getFullYear() === curYear && d.getMonth() === curMonth
  })
  const prevMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getFullYear() === prevMonthYear && d.getMonth() === prevMonth
  })

  const curMonthTotal = curMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const curMonthFuel = curMonthExpenses
    .filter((e) => e.category === 'Fuel')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const curMonthService = curMonthExpenses
    .filter((e) => e.category === 'Service')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  let monthTrend = null
  if (prevMonthTotal > 0) {
    const delta = Math.round(((curMonthTotal - prevMonthTotal) / prevMonthTotal) * 100)
    monthTrend = delta
  }

  // Urgent attention items (Overdue reminders, expired insurance, expired PUC)
  const attentionItems = []

  // 1. Insurance expiry check
  if (activeVehicle.insurance_expiry) {
    const days = getDaysDifference(activeVehicle.insurance_expiry)
    if (days !== null && days < 0) {
      attentionItems.push({
        id: 'att-ins-exp',
        type: 'danger',
        title: 'Insurance Policy Expired',
        description: `Expired on ${formatDate(activeVehicle.insurance_expiry)} (${Math.abs(days)} days ago). Driving without insurance carries severe legal and financial penalties.`,
        action: () => {
          setRenewalDocType('Insurance Policy')
          setRenewalModalOpen(true)
        },
        actionLabel: 'Renew Policy',
      })
    } else if (days !== null && days <= 30) {
      attentionItems.push({
        id: 'att-ins-soon',
        type: 'warning',
        title: 'Insurance Renewal Due Soon',
        description: `Your insurance policy expires in ${days} days (${formatDate(activeVehicle.insurance_expiry)}).`,
        action: () => {
          setRenewalDocType('Insurance Policy')
          setRenewalModalOpen(true)
        },
        actionLabel: 'Renew Policy',
      })
    }
  }

  // 2. PUC expiry check
  if (activeVehicle.puc_expiry) {
    const days = getDaysDifference(activeVehicle.puc_expiry)
    if (days !== null && days < 0) {
      attentionItems.push({
        id: 'att-puc-exp',
        type: 'danger',
        title: 'PUC / Emission Certificate Expired',
        description: `Expired on ${formatDate(activeVehicle.puc_expiry)}. Schedule a tailpipe emission test immediately to avoid traffic fines.`,
        action: () => {
          setRenewalDocType('Pollution Certificate (PUC)')
          setRenewalModalOpen(true)
        },
        actionLabel: 'Renew PUC',
      })
    } else if (days !== null && days <= 15) {
      attentionItems.push({
        id: 'att-puc-soon',
        type: 'warning',
        title: 'PUC Test Due Soon',
        description: `Emission certificate expires in ${days} days (${formatDate(activeVehicle.puc_expiry)}).`,
        action: () => {
          setRenewalDocType('Pollution Certificate (PUC)')
          setRenewalModalOpen(true)
        },
        actionLabel: 'Renew PUC',
      })
    }
  }

  // 3. Overdue reminders
  reminders
    .filter((r) => !r.is_completed)
    .forEach((r) => {
      const days = getDaysDifference(r.due_date)
      const remainingKm =
        r.due_odometer && activeVehicle.current_odometer
          ? Number(r.due_odometer) - Number(activeVehicle.current_odometer)
          : null

      if ((days !== null && days < 0) || (remainingKm !== null && remainingKm <= 0)) {
        attentionItems.push({
          id: `att-rem-${r.id}`,
          type: 'danger',
          title: `Overdue: ${r.title}`,
          description: days !== null && days < 0 ? `Due date was ${formatDate(r.due_date)}` : `Odometer passed ${r.due_odometer} km`,
          action: () => {
            if (r.type === 'Service' || r.title.toLowerCase().includes('service')) {
              onQuickAction('service')
            } else {
              onNavigate('reminders')
            }
          },
          actionLabel: r.type === 'Service' ? 'Record Service' : 'Review Schedule',
        })
      }
    })

  const recentTimeline = timeline.slice(0, 4)

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SECTION A: ACTIVE VEHICLE CARD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#EFF6FF] text-[#17365D] border border-[#DBEAFE] flex items-center justify-center shrink-0 shadow-xs">
            {activeVehicle.type === 'motorcycle' || activeVehicle.type === 'scooter' ? (
              <Bike className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : (
              <Car className="w-7 h-7 sm:w-8 sm:h-8" />
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#17365D]">Active Vehicle</span>
              <span className="text-xs text-[#CBD5E1]">•</span>
              <Badge variant="primary">{activeVehicle.type?.toUpperCase()}</Badge>
              {activeVehicle.fuel_type && <Badge variant="neutral">{activeVehicle.fuel_type}</Badge>}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight truncate">
              {activeVehicle.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-[#475569] pt-0.5">
              <span>
                {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
              </span>
              <span className="text-[#CBD5E1]">|</span>
              <span className="font-mono text-[#0F172A] font-semibold">
                {activeVehicle.license_plate || 'No plate recorded'}
              </span>
              <span className="text-[#CBD5E1]">|</span>
              <span className="flex items-center gap-1 font-bold text-[#0F172A]">
                <Gauge className="w-3.5 h-3.5 text-[#64748B]" />
                {Number(activeVehicle.current_odometer || 0).toLocaleString()} km
              </span>
            </div>
          </div>
        </div>

        {/* Quick Compliance Status Badges & Dossier Report */}
        <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#F1F5F9]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="text-xs font-bold text-[#17365D] border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] shadow-2xs mr-1"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
            Print Vehicle Dossier
          </Button>

          {activeVehicle.insurance_expiry ? (
            getDaysDifference(activeVehicle.insurance_expiry) < 0 ? (
              <Badge variant="danger">Insurance Expired</Badge>
            ) : (
              <Badge variant="success">Insurance Valid</Badge>
            )
          ) : (
            <Badge variant="warning">No Insurance Logged</Badge>
          )}

          {activeVehicle.puc_expiry ? (
            getDaysDifference(activeVehicle.puc_expiry) < 0 ? (
              <Badge variant="danger">PUC Expired</Badge>
            ) : (
              <Badge variant="success">PUC Valid</Badge>
            )
          ) : null}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A.1: AUTOCARE ASSIST (Gemini-Powered Problem Solver) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#17365D] via-[#1E3A8A] to-[#2563EB] rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>AutoCare Assist • Context-Aware Problem Solver</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Vehicle problems? Let's find the next step.
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Grounded diagnostics, verified records, nearby garages, puncture repair, and emergency guidance powered by Gemini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('assist')}
              className="bg-white text-[#17365D] hover:bg-blue-50 font-extrabold text-xs shadow-md border-0"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-[#2563EB]" />
              Open Assistant
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold text-blue-200 shrink-0">Try asking:</span>
          {[
            "My vehicle won't start",
            "Find nearby garages",
            "Find puncture repair",
            "My engine is overheating",
            "When was my last service?",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate('assist')}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-all border border-white/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: NEEDS ATTENTION (Urgent Actions or All Clear) */}
      {/* ========================================================================= */}
      {attentionItems.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#DC2626] uppercase tracking-wider px-1">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
            <span>Needs Attention ({attentionItems.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {attentionItems.map((item) => {
              const isDanger = item.type === 'danger'
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 shadow-2xs ${
                    isDanger
                      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isDanger ? (
                      <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold leading-snug">{item.title}</h4>
                      <p className="text-xs opacity-90 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-black/5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={item.action}
                      className="text-xs font-semibold bg-white"
                    >
                      {item.actionLabel} →
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between gap-3 text-xs text-[#065F46]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0" />
            <span className="font-semibold">
              Vehicle Health All Clear: No overdue maintenance, expired documents, or pending alerts for {activeVehicle.name}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reminders')}
            className="text-xs font-bold text-[#059669] hover:underline shrink-0"
          >
            View Schedules →
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: ZERO-FRICTION INSTANT ACTIONS */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider px-1">
          Zero-Friction Actions
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. Quick Fuel */}
          <button
            type="button"
            onClick={() => onQuickAction('fuel')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#D97706] hover:bg-[#FFFBEB]/40 transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#0F172A]">Quick Fuel</span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Amount & 1-tap repeat</span>
          </button>

          {/* 2. Repeat Service */}
          <button
            type="button"
            onClick={() => {
              if (latestService) {
                onQuickAction('repeat-service', latestService)
              } else {
                onQuickAction('service')
              }
            }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#0F172A]">
              {latestService ? 'Repeat Service' : 'Record Service'}
            </span>
            <span className="text-[10px] text-[#64748B] mt-0.5">
              {latestService ? latestService.garage || 'Workshop' : 'Maintenance'}
            </span>
          </button>

          {/* 3. Scan Receipt */}
          <button
            type="button"
            onClick={() => setReceiptModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#059669] hover:bg-[#ECFDF5]/40 transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#0F172A]">Scan Receipt</span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Auto OCR extraction</span>
          </button>

          {/* 4. Renew Document */}
          <button
            type="button"
            onClick={() => {
              setRenewalDocType('Insurance Policy')
              setRenewalModalOpen(true)
            }}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#475569] hover:bg-[#F8FAFC] transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#0F172A]">Renew Policy</span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Insurance / PUC</span>
          </button>

          {/* 5. Before You Service Brief */}
          <button
            type="button"
            onClick={() => setBeforeServiceModalOpen(true)}
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#7C3AED] hover:bg-[#FAF5FF]/40 transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#0F172A]">Mechanic Brief</span>
            <span className="text-[10px] text-[#64748B] mt-0.5">Pre-service checklist</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: OWNERSHIP SNAPSHOT & MONTHLY DIGEST */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
            Ownership Snapshot & Monthly Digest
          </span>
          <span className="text-xs text-[#64748B]">
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Monthly Digest Highlight Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#FFFFFF] to-[#F8FAFC] border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#17365D] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              This Month's Vehicle Spend
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {formatCurrency(curMonthTotal, currency)}
              </span>
              {monthTrend !== null && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    monthTrend > 0
                      ? 'bg-[#FEF2F2] text-[#DC2626]'
                      : 'bg-[#ECFDF5] text-[#16A34A]'
                  }`}
                >
                  {monthTrend > 0 ? `+${monthTrend}%` : `${monthTrend}%`} vs last month
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Fuel: {formatCurrency(curMonthFuel, currency)} • Service: {formatCurrency(curMonthService, currency)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('expenses')}
              className="text-xs font-semibold"
            >
              Expense Ledger →
            </Button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Spend */}
          <Card hoverable onClick={() => onNavigate('expenses')} className="cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#64748B] block truncate">
                  Total Spend (All-Time)
                </span>
                <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight block">
                  {formatCurrency(expenseSummary.totalSpent, currency)}
                </span>
                <span className="text-[10px] text-[#64748B] block truncate mt-0.5">
                  Across {expenses.length} recorded items
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Verified Fuel Economy */}
          <Card hoverable onClick={() => onNavigate('fuel')} className="cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#64748B] block truncate">
                  Fuel Economy
                </span>
                <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight block truncate">
                  {fuelSummary.avgEfficiency ? `${fuelSummary.avgEfficiency} ${fuelSummary.efficiencyUnit}` : 'Calculating'}
                </span>
                <span className="text-[10px] text-[#64748B] block truncate mt-0.5">
                  {fuelSummary.avgEfficiency
                    ? `From ${fuelLogs.filter((f) => f.is_full_tank).length} full fills`
                    : 'Requires 2 full tank fills'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Services Completed */}
          <Card hoverable onClick={() => onNavigate('services')} className="cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#17365D] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#64748B] block truncate">
                  Services Completed
                </span>
                <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight block">
                  {services.length}
                </span>
                <span className="text-[10px] text-[#64748B] block truncate mt-0.5">
                  {latestService ? `Last: ${formatDate(latestService.date)}` : 'None logged yet'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Active Reminders */}
          <Card hoverable onClick={() => onNavigate('reminders')} className="cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5FF] text-[#7C3AED] border border-[#F3E8FF] flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#64748B] block truncate">
                  Active Reminders
                </span>
                <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight block">
                  {reminders.filter((r) => !r.is_completed).length}
                </span>
                <span className="text-[10px] text-[#64748B] block truncate mt-0.5">
                  {attentionItems.length > 0 ? `${attentionItems.length} require action` : 'All schedules on track'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION E: RECENT ACTIVITY & VEHICLE TIMELINE */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
            Recent Activity
          </span>
          <button
            type="button"
            onClick={() => onNavigate('timeline')}
            className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>Complete Vehicle Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTimeline.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E2E8F0] space-y-2">
            <Car className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <h4 className="text-sm font-bold text-[#0F172A]">No vehicle events logged yet</h4>
            <p className="text-xs text-[#64748B]">
              Refuels, service visits, document uploads, and expenses will build your chronological timeline automatically.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] shadow-xs overflow-hidden">
            {recentTimeline.map((item) => {
              const isFuel = item.type === 'fuel'
              const isService = item.type === 'service'
              const isExpense = item.type === 'expense'

              return (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isFuel
                          ? 'bg-[#FFFBEB] text-[#D97706]'
                          : isService
                          ? 'bg-[#EFF6FF] text-[#2563EB]'
                          : 'bg-[#ECFDF5] text-[#059669]'
                      }`}
                    >
                      {isFuel && <Fuel className="w-5 h-5" />}
                      {isService && <Wrench className="w-5 h-5" />}
                      {isExpense && <Receipt className="w-5 h-5" />}
                      {!isFuel && !isService && !isExpense && <FileText className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                        <span>{formatDate(item.date)}</span>
                        {item.subtitle && (
                          <>
                            <span>•</span>
                            <span className="truncate">{item.subtitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.amount && (
                    <div className="text-xs sm:text-sm font-extrabold text-[#0F172A] shrink-0">
                      {formatCurrency(item.amount, currency)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* INTEGRATED MODALS */}
      {/* ========================================================================= */}
      {/* 1. Smart Receipt Capture */}
      <ReceiptCaptureModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        vehicle={activeVehicle}
        userId={user?.id}
        onRecordFuel={async (data) => {
          if (user && activeVehicle) {
            await createFuelLog(user.id, activeVehicle.id, data)
            await loadVehicles()
            await fetchDashboardData()
          }
        }}
        onRecordService={async (data) => {
          if (user && activeVehicle) {
            await createService(user.id, activeVehicle.id, data)
            await loadVehicles()
            await fetchDashboardData()
          }
        }}
        onRecordExpense={async (data) => {
          if (user && activeVehicle) {
            await createExpense(user.id, activeVehicle.id, data)
            await fetchDashboardData()
          }
        }}
        onUploadDocument={async (file, meta) => {
          if (user && activeVehicle) {
            await uploadDocument(user.id, activeVehicle.id, file, meta)
          }
        }}
        onSuccess={() => {
          fetchDashboardData()
        }}
      />

      {/* 2. Document Renewal Modal */}
      <DocumentRenewalModal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        docType={renewalDocType}
        vehicle={activeVehicle}
        userId={user?.id}
        onSuccess={async () => {
          await loadVehicles()
          await fetchDashboardData()
        }}
      />

      {/* 3. Before You Service Brief */}
      <BeforeYouServiceModal
        isOpen={beforeServiceModalOpen}
        onClose={() => setBeforeServiceModalOpen(false)}
        vehicle={activeVehicle}
        services={services}
        reminders={reminders}
        currency={currency}
      />

      {/* 4. Complete Vehicle Ownership Dossier Report */}
      <VehicleReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        vehicle={activeVehicle}
        services={services}
        fuelLogs={fuelLogs}
        expenses={expenses}
        reminders={reminders}
        documents={documents}
        currency={currency}
        distanceUnit={distanceUnit}
        volumeUnit={volumeUnit}
      />
    </div>
  )
}
