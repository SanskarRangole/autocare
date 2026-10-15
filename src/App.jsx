import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { VehicleProvider, useVehicles } from './context/VehicleContext'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { MobileNav } from './components/layout/MobileNav'
import { AuthModal } from './components/auth/AuthModal'
import { HomePage } from './components/home/HomePage'

// Views
import { Dashboard } from './components/dashboard/Dashboard'
import { AutoCareAssist } from './components/assist/AutoCareAssist'
import { AssistLauncher } from './components/assist/AssistLauncher'
import { VehicleList } from './components/vehicles/VehicleList'
import { ServiceList } from './components/services/ServiceList'
import { FuelLogList } from './components/fuel/FuelLogList'
import { ReminderList } from './components/reminders/ReminderList'
import { ExpenseList } from './components/expenses/ExpenseList'
import { DocumentList } from './components/documents/DocumentList'
import { VehicleTimeline } from './components/timeline/VehicleTimeline'
import { SettingsView } from './components/settings/SettingsView'

// Modals
import { VehicleFormModal } from './components/vehicles/VehicleFormModal'
import { ServiceFormModal } from './components/services/ServiceFormModal'
import { FuelFormModal } from './components/fuel/FuelFormModal'
import { ExpenseFormModal } from './components/expenses/ExpenseFormModal'
import { ReminderFormModal } from './components/reminders/ReminderFormModal'
import { DocumentUploadModal } from './components/documents/DocumentUploadModal'
import { DocumentRenewalModal } from './components/documents/DocumentRenewalModal'
import { VehicleReportModal } from './components/vehicles/VehicleReportModal'

import {
  createService,
  createFuelLog,
  createExpense,
  createReminder,
  uploadDocument,
} from './lib/storage'

function MainLayout() {
  const { user } = useAuth()
  const {
    vehicles,
    activeVehicle,
    createVehicle,
    updateVehicle,
    loadVehicles,
  } = useVehicles()

  const [currentTab, setCurrentTab] = useState('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)

  // Quick Action Modals
  const [quickServiceOpen, setQuickServiceOpen] = useState(false)
  const [repeatServiceSource, setRepeatServiceSource] = useState(null)
  const [quickFuelOpen, setQuickFuelOpen] = useState(false)
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false)
  const [quickReminderOpen, setQuickReminderOpen] = useState(false)
  const [quickDocumentOpen, setQuickDocumentOpen] = useState(false)

  // Document Renewal & Dossier Report Modals
  const [renewalModalOpen, setRenewalModalOpen] = useState(false)
  const [renewalDocType, setRenewalDocType] = useState('Insurance Policy')
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const handleOpenRenewal = (docType = 'Insurance Policy') => {
    setRenewalDocType(docType)
    setRenewalModalOpen(true)
  }

  const handleOpenReport = () => {
    setReportModalOpen(true)
  }

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null)
    setVehicleModalOpen(true)
  }

  const handleEditVehicle = (veh) => {
    setEditingVehicle(veh)
    setVehicleModalOpen(true)
  }

  const handleSaveVehicle = async (data, rcFile = null, saveRcConsent = false) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.id, data)
    } else {
      const newVeh = await createVehicle(data)
      if (newVeh && rcFile && saveRcConsent && user) {
        try {
          await uploadDocument(user.id, newVeh.id, rcFile, {
            name: `Registration Certificate (${data.license_plate || data.name})`,
            type: 'Registration Certificate (RC)',
            notes: 'Document uploaded during RC OCR vehicle registration',
          })
        } catch (docErr) {
          console.warn('Failed to upload RC document to documents vault:', docErr)
        }
      }
    }
  }

  const handleQuickAction = (actionType, payload = null) => {
    if (actionType === 'service') {
      setRepeatServiceSource(null)
      setQuickServiceOpen(true)
    }
    if (actionType === 'repeat-service') {
      setRepeatServiceSource(payload)
      setQuickServiceOpen(true)
    }
    if (actionType === 'fuel') setQuickFuelOpen(true)
    if (actionType === 'expense') setQuickExpenseOpen(true)
    if (actionType === 'reminder') setQuickReminderOpen(true)
    if (actionType === 'document') setQuickDocumentOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        <Navbar
          currentTab={currentTab}
          onNavigate={(tab) => {
            if (tab === 'auth') setAuthModalOpen(true)
            else setCurrentTab(tab)
          }}
          onOpenNewVehicleModal={handleOpenAddVehicle}
          onQuickAction={handleQuickAction}
        />

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={setCurrentTab}
              onQuickAction={handleQuickAction}
              onOpenAddVehicleModal={handleOpenAddVehicle}
              onOpenRenewalModal={handleOpenRenewal}
              onOpenReportModal={handleOpenReport}
            />
          )}

          {currentTab === 'assist' && (
            <AutoCareAssist
              onNavigate={setCurrentTab}
              onQuickAction={handleQuickAction}
              onOpenRenewalModal={handleOpenRenewal}
              onOpenReportModal={handleOpenReport}
            />
          )}

          {currentTab === 'vehicles' && (
            <VehicleList
              onOpenAddModal={handleOpenAddVehicle}
              onEditVehicle={handleEditVehicle}
            />
          )}

          {currentTab === 'services' && <ServiceList />}

          {currentTab === 'fuel' && <FuelLogList />}

          {currentTab === 'reminders' && <ReminderList />}

          {currentTab === 'expenses' && <ExpenseList />}

          {currentTab === 'documents' && <DocumentList />}

          {currentTab === 'timeline' && <VehicleTimeline />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      <MobileNav
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onQuickAction={handleQuickAction}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Vehicle Form Modal */}
      <VehicleFormModal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false)
          setEditingVehicle(null)
        }}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
        existingVehicles={vehicles}
      />

      {/* Quick Action Modals */}
      {activeVehicle && user && (
        <>
          <ServiceFormModal
            isOpen={quickServiceOpen}
            onClose={() => {
              setQuickServiceOpen(false)
              setRepeatServiceSource(null)
            }}
            repeatSource={repeatServiceSource}
            onSave={async (data, invoiceFile = null, autoReminder = null) => {
              await createService(user.id, activeVehicle.id, data)
              if (invoiceFile) {
                try {
                  await uploadDocument(user.id, activeVehicle.id, invoiceFile, {
                    name: `Invoice: ${data.service_type} (${data.date})`,
                    type: 'Service Invoice',
                    notes: `Garage: ${data.garage || 'N/A'} - Cost: ${data.cost}`,
                  })
                } catch (e) {
                  console.warn('Failed to upload invoice document:', e)
                }
              }
              if (autoReminder) {
                try {
                  await createReminder(user.id, activeVehicle.id, autoReminder)
                } catch (e) {
                  console.warn('Failed to auto-create service reminder:', e)
                }
              }
              await loadVehicles()
            }}
            currentOdometer={activeVehicle.current_odometer}
            vehicle={activeVehicle}
          />

          <FuelFormModal
            isOpen={quickFuelOpen}
            onClose={() => setQuickFuelOpen(false)}
            onSave={async (data) => {
              await createFuelLog(user.id, activeVehicle.id, data)
              await loadVehicles()
            }}
            currentOdometer={activeVehicle.current_odometer}
            vehicle={activeVehicle}
          />

          <ExpenseFormModal
            isOpen={quickExpenseOpen}
            onClose={() => setQuickExpenseOpen(false)}
            onSave={async (data) => {
              await createExpense(user.id, activeVehicle.id, data)
            }}
          />

          <ReminderFormModal
            isOpen={quickReminderOpen}
            onClose={() => setQuickReminderOpen(false)}
            onSave={async (data) => {
              await createReminder(user.id, activeVehicle.id, data)
            }}
            currentOdometer={activeVehicle.current_odometer}
          />

          <DocumentUploadModal
            isOpen={quickDocumentOpen}
            onClose={() => setQuickDocumentOpen(false)}
            onUpload={async (file, meta) => {
              await uploadDocument(user.id, activeVehicle.id, file, meta)
            }}
            vehicleName={activeVehicle.name}
          />

          <DocumentRenewalModal
            isOpen={renewalModalOpen}
            onClose={() => setRenewalModalOpen(false)}
            vehicle={activeVehicle}
            initialDocType={renewalDocType}
            onRenewSuccess={async () => {
              await loadVehicles()
            }}
          />

          <VehicleReportModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            vehicle={activeVehicle}
          />
        </>
      )}

      {/* Floating AutoCare Assist Launcher */}
      <AssistLauncher
        currentTab={currentTab}
        onOpenAssist={() => setCurrentTab('assist')}
      />
    </div>
  )
}

function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <img
          src="/autocare-logo.jpg"
          alt="AutoCare Logo"
          className="w-16 h-16 rounded-2xl object-cover border border-[#E2E8F0] shadow-md animate-pulse"
        />
        <div className="flex items-center gap-2 text-sm font-semibold text-[#17365D]">
          <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
          <span>Synchronizing AutoCare telemetry...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <HomePage />
  }

  return <MainLayout />
}

export default function App() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <AppRouter />
      </VehicleProvider>
    </AuthProvider>
  )
}
