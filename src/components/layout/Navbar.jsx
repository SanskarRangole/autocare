import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useVehicles } from '../../context/VehicleContext'
import { Button } from '../ui/Button'
import {
  Car,
  Bike,
  Plus,
  ChevronDown,
  LogOut,
  Settings,
  Fuel,
  Wrench,
  Receipt,
  Bell,
  FileUp,
  Check,
} from 'lucide-react'

const TAB_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview, health alerts, and active vehicle status' },
  assist: { title: 'AutoCare Assist', subtitle: 'Gemini-powered real-world vehicle problem solver and nearby assistance' },
  vehicles: { title: 'Garage & Vehicles', subtitle: 'Manage your personal fleet of cars and motorcycles' },
  services: { title: 'Service History', subtitle: 'Detailed maintenance logs and garage repairs' },
  fuel: { title: 'Fuel & Mileage', subtitle: 'Tank-to-tank fuel tracking and economy analytics' },
  reminders: { title: 'Reminders & Schedules', subtitle: 'Upcoming service, insurance, and PUC checkpoints' },
  expenses: { title: 'Expenses & Analytics', subtitle: 'Cost of ownership ledger and categorical charts' },
  documents: { title: 'Vehicle Documents', subtitle: 'Encrypted storage for RC, insurance policies, and invoices' },
  timeline: { title: 'Ownership Timeline', subtitle: 'Chronological life story of your vehicle' },
  settings: { title: 'Settings & Preferences', subtitle: 'Regional units, currency, and database configuration' },
}

export function Navbar({
  currentTab = 'dashboard',
  onNavigate,
  onOpenNewVehicleModal,
  onQuickAction,
}) {
  const { user, profile, signOut, isLiveDatabase } = useAuth()
  const { vehicles, activeVehicle, selectVehicle } = useVehicles()

  const [vehicleMenuOpen, setVehicleMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [quickActionMenuOpen, setQuickActionMenuOpen] = useState(false)

  const meta = TAB_TITLES[currentTab] || { title: 'Dashboard', subtitle: 'Overview and status' }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] h-[72px] px-4 sm:px-8">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left: Page Title & Context Subtitle */}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight truncate leading-tight">
            {meta.title}
          </h1>
          <p className="text-xs text-[#64748B] hidden sm:block truncate mt-0.5">{meta.subtitle}</p>
        </div>

        {/* Right: Vehicle Switcher, Quick Action, Database Pill, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Global Vehicle Selector (if user & vehicles exist) */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setVehicleMenuOpen(!vehicleMenuOpen)
                  setUserMenuOpen(false)
                  setQuickActionMenuOpen(false)
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all text-left shadow-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] text-[#17365D] border border-[#DBEAFE] flex items-center justify-center shrink-0">
                  {activeVehicle?.type === 'motorcycle' || activeVehicle?.type === 'scooter' ? (
                    <Bike className="w-3.5 h-3.5" />
                  ) : (
                    <Car className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="max-w-[120px] sm:max-w-[170px] truncate">
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {activeVehicle ? activeVehicle.name : 'Select Vehicle'}
                  </div>
                  {activeVehicle && (
                    <div className="text-[10px] text-[#64748B] truncate">
                      {activeVehicle.year} {activeVehicle.make}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 ml-0.5" />
              </button>

              {/* Vehicle Dropdown */}
              {vehicleMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setVehicleMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-2 z-50 animate-fade-in">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      My Garage ({vehicles.length})
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 my-1">
                      {vehicles.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-[#64748B]">No vehicles added yet</div>
                      ) : (
                        vehicles.map((v) => {
                          const isSel = activeVehicle?.id === v.id
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                selectVehicle(v.id)
                                setVehicleMenuOpen(false)
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${
                                isSel
                                  ? 'bg-[#EFF6FF] text-[#17365D] font-semibold'
                                  : 'text-[#334155] hover:bg-[#F8FAFC]'
                              }`}
                            >
                              <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] text-[#475569] flex items-center justify-center shrink-0">
                                {v.type === 'motorcycle' || v.type === 'scooter' ? (
                                  <Bike className="w-4 h-4" />
                                ) : (
                                  <Car className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs truncate">{v.name}</div>
                                <div className="text-[10px] text-[#64748B] truncate">
                                  {v.license_plate || `${v.year} ${v.make}`} •{' '}
                                  {Number(v.current_odometer || 0).toLocaleString()} km
                                </div>
                              </div>
                              {isSel && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
                            </button>
                          )
                        })
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#F1F5F9]">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setVehicleMenuOpen(false)
                          onOpenNewVehicleModal()
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add New Vehicle
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick Log Action */}
          {user && activeVehicle && (
            <div className="relative">
              <Button
                variant="royal"
                size="sm"
                className="hidden sm:inline-flex text-xs font-semibold"
                onClick={() => {
                  setQuickActionMenuOpen(!quickActionMenuOpen)
                  setUserMenuOpen(false)
                  setVehicleMenuOpen(false)
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Quick Log
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>

              {quickActionMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setQuickActionMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-1.5 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionMenuOpen(false)
                        onQuickAction('fuel')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#334155] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    >
                      <Fuel className="w-4 h-4 text-[#D97706]" />
                      Log Fuel Fill-Up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionMenuOpen(false)
                        onQuickAction('service')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#334155] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    >
                      <Wrench className="w-4 h-4 text-[#2563EB]" />
                      Log Service Record
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionMenuOpen(false)
                        onQuickAction('expense')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#334155] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-[#059669]" />
                      Add Vehicle Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionMenuOpen(false)
                        onQuickAction('reminder')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#334155] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    >
                      <Bell className="w-4 h-4 text-[#7C3AED]" />
                      Set Reminder Checkpoint
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickActionMenuOpen(false)
                        onQuickAction('document')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#334155] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    >
                      <FileUp className="w-4 h-4 text-[#64748B]" />
                      Upload Vehicle Document
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Database Mode Status Pill */}
          <div
            title={
              isLiveDatabase
                ? 'Connected to live Supabase PostgreSQL database with Row Level Security (RLS)'
                : 'Operating in local storage mode'
            }
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-white shadow-xs cursor-help"
          >
            {isLiveDatabase ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                <span className="text-[#059669] font-semibold">Supabase RLS</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span className="text-[#2563EB] font-semibold">Local Demo</span>
              </>
            )}
          </div>

          {/* User Account Menu */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen)
                  setVehicleMenuOpen(false)
                  setQuickActionMenuOpen(false)
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-[#17365D] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.email ? user.email.substring(0, 2).toUpperCase() : 'AC'}
                </div>
                <span className="hidden xl:inline text-xs font-semibold text-[#0F172A] max-w-[120px] truncate">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-1.5 z-50">
                    <div className="px-3.5 py-2.5 border-b border-[#F1F5F9]">
                      <div className="text-xs font-bold text-[#0F172A] truncate">
                        {profile?.full_name || 'Vehicle Owner'}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate">{user.email}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        onNavigate('settings')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#334155] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#64748B]" />
                      Settings & Preferences
                    </button>

                    <div className="border-t border-[#F1F5F9] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#DC2626] rounded-xl hover:bg-[#FEF2F2] transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-[#DC2626]" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onNavigate('auth')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
