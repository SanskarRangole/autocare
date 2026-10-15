import React from 'react'
import {
  LayoutDashboard,
  Sparkles,
  Car,
  Wrench,
  Fuel,
  BellRing,
  PieChart,
  FileText,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'

export function Sidebar({ currentTab, onNavigate, isCollapsed, onToggleCollapse }) {
  const { user, profile, signOut } = useAuth()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assist', label: 'AutoCare Assist', icon: Sparkles, badge: 'AI' },
    { id: 'vehicles', label: 'Garage & Vehicles', icon: Car },
    { id: 'services', label: 'Service History', icon: Wrench },
    { id: 'fuel', label: 'Fuel & Mileage', icon: Fuel },
    { id: 'reminders', label: 'Reminders', icon: BellRing },
    { id: 'expenses', label: 'Expenses & Analytics', icon: PieChart },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-[#E2E8F0] h-screen sticky top-0 shrink-0 transition-all duration-200 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-[72px] px-4 flex items-center justify-between border-b border-[#F1F5F9]">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/autocare-logo.jpg"
            alt="AutoCare Logo"
            className="w-10 h-10 rounded-xl object-cover border border-[#E2E8F0] shadow-2xs shrink-0"
          />
          {!isCollapsed && (
            <div className="truncate">
              <div className="font-extrabold text-[#0F172A] text-lg tracking-tight leading-none">
                AutoCare
              </div>
              <div className="text-[10px] font-bold text-[#2563EB] mt-1 tracking-wider uppercase">
                AI Maintenance
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Menu
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 relative group ${
                isActive
                  ? 'bg-[#EFF6FF] text-[#17365D] font-semibold'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              {/* Active Indicator Bar on left */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 w-1 h-5 bg-[#2563EB] rounded-r-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#0F172A]'
                }`}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#2563EB] text-white tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer Profile Area */}
      <div className="p-3 border-t border-[#F1F5F9] space-y-1">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors text-left ${
                isCollapsed ? 'justify-center p-1' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#17365D] border border-[#DBEAFE] flex items-center justify-center font-bold text-xs shrink-0">
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'AC'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#0F172A] truncate">
                    {profile?.full_name || 'Vehicle Owner'}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate">{user.email}</div>
                </div>
              )}
            </button>

            {!isCollapsed && (
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#DC2626] hover:bg-rose-50 rounded-lg transition-colors font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </>
        ) : (
          !isCollapsed && (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#64748B]">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Isolated by Supabase RLS</span>
            </div>
          )
        )}
      </div>
    </aside>
  )
}
