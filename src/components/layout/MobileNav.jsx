import React, { useState } from 'react'
import {
  LayoutDashboard,
  Sparkles,
  Wrench,
  Fuel,
  Receipt,
  MoreHorizontal,
  BellRing,
  FileText,
  History,
  Car,
  Settings,
  Plus,
  FileUp,
  X,
} from 'lucide-react'

export function MobileNav({ currentTab, onNavigate, onQuickAction }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showQuickMenu, setShowQuickMenu] = useState(false)

  const secondaryItems = [
    { id: 'assist', label: 'AutoCare Assist (AI)', icon: Sparkles },
    { id: 'vehicles', label: 'Garage & Vehicles', icon: Car },
    { id: 'expenses', label: 'Expenses & Analytics', icon: Receipt },
    { id: 'reminders', label: 'Reminders & Compliance', icon: BellRing },
    { id: 'documents', label: 'Documents Vault', icon: FileText },
    { id: 'timeline', label: 'Ownership Timeline', icon: History },
    { id: 'settings', label: 'Settings & Units', icon: Settings },
  ]

  const handleQuickSelect = (action) => {
    setShowQuickMenu(false)
    if (onQuickAction) {
      onQuickAction(action)
    }
  }

  return (
    <>
      {/* Quick Action Bottom Sheet */}
      {showQuickMenu && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setShowQuickMenu(false)}
        >
          <div
            className="bg-white rounded-t-3xl shadow-2xl border-t border-[#E2E8F0] p-5 space-y-3 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                Quick Action (Active Vehicle)
              </span>
              <button
                type="button"
                onClick={() => setShowQuickMenu(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickSelect('fuel')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] font-semibold text-xs transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#D97706] shadow-2xs">
                  <Fuel className="w-4 h-4" />
                </div>
                <span>Log Fuel Fill-Up</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('service')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] font-semibold text-xs transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#2563EB] shadow-2xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <span>Record Service & Maintenance</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('expense')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] font-semibold text-xs transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#059669] shadow-2xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <span>Add Vehicle Expense</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('document')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] font-semibold text-xs transition-colors border border-[#E2E8F0]"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#475569] shadow-2xs">
                  <FileUp className="w-4 h-4" />
                </div>
                <span>Upload Document / Policy</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('reminder')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#6B21A8] font-semibold text-xs transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#7C3AED] shadow-2xs">
                  <BellRing className="w-4 h-4" />
                </div>
                <span>Set Maintenance Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation More Menu */}
      {showMoreMenu && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-white rounded-t-3xl shadow-2xl border-t border-[#E2E8F0] p-4 space-y-1 animate-fade-in mb-14"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
              More Navigation
            </div>
            {secondaryItems.map((item) => {
              const Icon = item.icon
              const isActive = currentTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id)
                    setShowMoreMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#17365D]'
                      : 'text-[#334155] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-3 py-1.5 flex items-center justify-between shadow-sm">
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => {
            setShowMoreMenu(false)
            onNavigate('dashboard')
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[10px] font-medium transition-colors ${
            currentTab === 'dashboard' ? 'text-[#17365D] font-bold' : 'text-[#64748B]'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mb-0.5 ${currentTab === 'dashboard' ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
          <span>Overview</span>
        </button>

        {/* Services */}
        <button
          type="button"
          onClick={() => {
            setShowMoreMenu(false)
            onNavigate('services')
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[10px] font-medium transition-colors ${
            currentTab === 'services' ? 'text-[#17365D] font-bold' : 'text-[#64748B]'
          }`}
        >
          <Wrench className={`w-5 h-5 mb-0.5 ${currentTab === 'services' ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
          <span>Services</span>
        </button>

        {/* Center Prominent Quick Add Button */}
        <div className="flex-1 flex items-center justify-center -mt-5">
          <button
            type="button"
            onClick={() => {
              setShowMoreMenu(false)
              setShowQuickMenu(true)
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#17365D] to-[#2563EB] text-white flex items-center justify-center shadow-lg shadow-[#2563EB]/25 hover:scale-105 active:scale-95 transition-transform"
            aria-label="Quick Action"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Fuel */}
        <button
          type="button"
          onClick={() => {
            setShowMoreMenu(false)
            onNavigate('fuel')
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[10px] font-medium transition-colors ${
            currentTab === 'fuel' ? 'text-[#17365D] font-bold' : 'text-[#64748B]'
          }`}
        >
          <Fuel className={`w-5 h-5 mb-0.5 ${currentTab === 'fuel' ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`} />
          <span>Fuel</span>
        </button>

        {/* More */}
        <button
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[10px] font-medium transition-colors ${
            showMoreMenu || secondaryItems.some((s) => s.id === currentTab)
              ? 'text-[#17365D] font-bold'
              : 'text-[#64748B]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5 text-[#94A3B8]" />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
