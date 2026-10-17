import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useVehicles } from '../../context/VehicleContext'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  User,
  Database,
  Sparkles,
  Trash2,
  CheckCircle2,
  Globe,
  Gauge,
  CircleDollarSign,
  Shield,
  Layers,
} from 'lucide-react'

export function SettingsView() {
  const {
    user,
    profile,
    updateProfile,
    isLiveDatabase,
  } = useAuth()
  const { seedDemoData, clearAllData, syncLocalData } = useVehicles()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [currency, setCurrency] = useState(profile?.currency || 'USD')
  const [distanceUnit, setDistanceUnit] = useState(profile?.distance_unit || 'km')
  const [volumeUnit, setVolumeUnit] = useState(profile?.volume_unit || 'litres')

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  const handleSyncToSupabase = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    try {
      const res = await syncLocalData()
      setSyncStatus({ success: true, message: res.message })
    } catch (err) {
      setSyncStatus({ success: false, message: err.message || 'Failed to sync with Supabase' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    try {
      await updateProfile({
        full_name: fullName,
        currency,
        distance_unit: distanceUnit,
        volume_unit: volumeUnit,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleClearConfirm = async () => {
    setIsClearing(true)
    try {
      await clearAllData()
      setConfirmClearOpen(false)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm font-normal text-[#475569] mt-1.5">
          Configure regional units, localized currency symbols, database synchronization, and developer fleet fixtures.
        </p>
      </div>

      {/* Profile & Regional Settings */}
      <Card>
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">
                Account & Regional Preferences
              </CardTitle>
              <p className="text-xs text-[#64748B]">Personal details and formatting standards for odometer, fuel, and cost calculations</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSavePreferences} className="space-y-6">
            {saveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium">Preferences successfully updated and synchronized.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="Full Name / Display Name"
                placeholder="e.g. Alex Mercer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={User}
              />

              <Input
                label="Email Address"
                value={user?.email || 'driver@autocare.app'}
                disabled
                hint="Managed through Supabase Auth provider"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <Select
                label="Currency Symbol"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD ($) - US Dollar' },
                  { value: 'EUR', label: 'EUR (€) - Euro' },
                  { value: 'GBP', label: 'GBP (£) - British Pound' },
                  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                  { value: 'CAD', label: 'CAD (CA$) - Canadian Dollar' },
                  { value: 'AUD', label: 'AUD (A$) - Australian Dollar' },
                  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
                ]}
              />

              <Select
                label="Distance Metric"
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                options={[
                  { value: 'km', label: 'Kilometers (km)' },
                  { value: 'miles', label: 'Miles (mi)' },
                ]}
              />

              <Select
                label="Fuel Volume Metric"
                value={volumeUnit}
                onChange={(e) => setVolumeUnit(e.target.value)}
                options={[
                  { value: 'litres', label: 'Litres (L)' },
                  { value: 'gallons', label: 'US Gallons (gal)' },
                ]}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[#F1F5F9]">
              <Button type="submit" variant="primary" size="md" loading={saving} className="px-6">
                Save Preferences
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Database & Supabase Environment Status */}
      <Card>
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">
                Database Architecture & Security
              </CardTitle>
              <p className="text-xs text-[#64748B]">Active persistence layer and Row Level Security status</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-[#0F172A]">
                  {isLiveDatabase ? 'Supabase PostgreSQL (Live Production)' : 'Local Storage Engine (Offline Sandbox)'}
                </span>
                <Badge variant={isLiveDatabase ? 'success' : 'primary'}>
                  {isLiveDatabase ? 'Connected' : 'Offline Mode'}
                </Badge>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed max-w-2xl">
                {isLiveDatabase
                  ? 'AutoCare is securely connected to your cloud Supabase PostgreSQL database. Row Level Security (RLS) is actively enforcing user tenancy isolation and signed document URLs.'
                  : 'Operating in self-contained local storage mode. All vehicles, service logs, fuel economy records, expenses, reminders, and documents are preserved in browser storage.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2.5">
            <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2563EB]" />
              Supabase Configuration Status
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Environment keys are configured via <code className="bg-[#F1F5F9] text-[#17365D] font-semibold px-1.5 py-0.5 rounded text-[11px]">VITE_SUPABASE_URL</code> and <code className="bg-[#F1F5F9] text-[#17365D] font-semibold px-1.5 py-0.5 rounded text-[11px]">VITE_SUPABASE_ANON_KEY</code>. Schema migrations reside in <code className="bg-[#F1F5F9] text-[#17365D] font-semibold px-1.5 py-0.5 rounded text-[11px]">supabase/schema.sql</code>.
            </p>
          </div>

          {isLiveDatabase && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50/50">
              <div>
                <div className="text-sm font-bold text-[#0F172A]">Sync Local Fleet to Supabase</div>
                <div className="text-xs text-[#64748B] mt-0.5">
                  Push your offline demo vehicles, service records, fuel logs, and reminders directly into your cloud Supabase database.
                </div>
                {syncStatus && (
                  <div className={`text-xs mt-2 font-medium ${syncStatus.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {syncStatus.message}
                  </div>
                )}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSyncToSupabase}
                loading={isSyncing}
                className="shrink-0 font-semibold text-xs"
              >
                <Layers className="w-4 h-4 mr-1.5" />
                Sync to Supabase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Developer & Evaluation Tools */}
      <Card>
        <CardHeader className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#0F172A]">
                Developer & Demo Fixtures
              </CardTitle>
              <p className="text-xs text-[#64748B]">Seed pre-configured vehicles or reset local data to test empty states</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <div>
              <div className="text-sm font-bold text-[#0F172A]">Seed Realistic Sample Fleet</div>
              <div className="text-xs text-[#64748B] mt-0.5">
                Populates a 2022 Honda Civic and 2023 Yamaha MT-07 with service records, fuel economy logs, expenses, and reminders.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={seedDemoData}
              className="shrink-0 font-semibold text-xs border-[#CBD5E1] hover:border-[#2563EB] hover:text-[#2563EB]"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
              Seed Sample Fleet
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-200 bg-rose-50/40">
            <div>
              <div className="text-sm font-bold text-rose-900">Reset Local Storage</div>
              <div className="text-xs text-rose-700 mt-0.5">
                Wipe all local vehicle entries to test clean empty states.
              </div>
            </div>
            <Button
              variant="dangerOutline"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
              className="shrink-0 text-xs font-semibold"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Clear Local Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearConfirm}
        title="Reset All Local Data?"
        description="This will clear your local storage vehicles, fuel logs, service history, and reminders so you can test empty states."
        loading={isClearing}
      />
    </div>
  )
}
