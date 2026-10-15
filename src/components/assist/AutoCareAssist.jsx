import React, { useState, useEffect, useRef } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import {
  getServices,
  getFuelLogs,
  getReminders,
  getExpenses,
  getDocuments,
} from '../../lib/storage'
import { sendAssistMessage, QUICK_ACTIONS } from '../../lib/assistClient'
import {
  getCurrentUserLocation,
  buildGoogleMapsSearchUrl,
  buildGoogleMapsDirectionsUrl,
  ASSISTANCE_CATEGORIES,
} from '../../lib/nearbyPlaces'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  Sparkles,
  Send,
  AlertTriangle,
  Flame,
  Wrench,
  Fuel,
  Receipt,
  ShieldAlert,
  Calendar,
  Clock,
  PieChart,
  Disc,
  MapPin,
  ExternalLink,
  Navigation,
  CheckCircle2,
  Car,
  Bike,
  RotateCcw,
  ShieldCheck,
  FileText,
  Printer,
  ChevronRight,
  Info,
  Loader2,
  X,
} from 'lucide-react'

export function AutoCareAssist({
  onNavigate,
  onQuickAction,
  onOpenRenewalModal,
  onOpenReportModal,
}) {
  const { activeVehicle, vehicles, selectVehicle } = useVehicles()
  const { currency, distanceUnit } = useAuth()

  // State
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: null,
      data: {
        shortAnswer:
          activeVehicle
            ? `Hello! I'm AutoCare Assist for your ${activeVehicle.year || ''} ${activeVehicle.make || ''} ${activeVehicle.model || activeVehicle.name}. Vehicle problems? Let's find the next step.`
            : "Hello! I'm AutoCare Assist, your vehicle problem solver. Select a vehicle or ask any automotive question to get started.",
        safetyWarning: null,
        suggestedSteps: [
          'Describe any warning lights, abnormal noises, or starting issues.',
          'Ask for nearby garages, puncture shops, towing, or fuel stations.',
          'Query your recorded service history, compliance dates, or expenses.',
        ],
        relevantRecords: activeVehicle
          ? [
              {
                label: 'Active Vehicle',
                value: `${activeVehicle.name}`,
                detail: `${activeVehicle.fuel_type || 'Petrol'} • ${activeVehicle.current_odometer || 0} km`,
              },
            ]
          : [],
        nearbyPlaces: [],
        suggestedActions: [
          { type: 'FIND_NEARBY', label: 'Find Nearby Garages', payload: { category: 'garage' } },
          { type: 'VIEW_SERVICES', label: 'Check Last Service', payload: {} },
          { type: 'PRINT_DOSSIER', label: 'Print Vehicle Dossier', payload: {} },
        ],
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [manualCity, setManualCity] = useState('')
  const [locationError, setLocationError] = useState(null)
  const [locationDetecting, setLocationDetecting] = useState(false)
  const [privacyNoticeAcknowledged, setPrivacyNoticeAcknowledged] = useState(true)

  // Cached Vehicle Data for Context Grounding
  const [vehicleContextData, setVehicleContextData] = useState({
    services: [],
    fuelLogs: [],
    expenses: [],
    reminders: [],
    documents: [],
  })

  const messagesEndRef = useRef(null)

  // Fetch contextual vehicle records when active vehicle changes
  useEffect(() => {
    async function loadData() {
      if (!activeVehicle) return
      try {
        const [srv, fuel, exp, rem, docs] = await Promise.all([
          getServices(activeVehicle.id),
          getFuelLogs(activeVehicle.id),
          getExpenses(activeVehicle.id),
          getReminders(activeVehicle.id),
          getDocuments(activeVehicle.id),
        ])
        setVehicleContextData({
          services: srv,
          fuelLogs: fuel,
          expenses: exp,
          reminders: rem,
          documents: docs,
        })
      } catch (err) {
        console.warn('Failed to load contextual vehicle data for assist:', err)
      }
    }
    loadData()
  }, [activeVehicle?.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Handle Geolocation Request
  const handleRequestLocation = async () => {
    setLocationDetecting(true)
    setLocationError(null)
    try {
      const loc = await getCurrentUserLocation()
      setUserLocation(loc)
    } catch (err) {
      setLocationError(err.message)
    } finally {
      setLocationDetecting(false)
    }
  }

  // Submit User Message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || loading) return

    const userMsgId = 'user-' + Date.now()
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]

    setMessages(newMessages)
    setInputMessage('')
    setLoading(true)

    // Build effective location
    const effectiveLoc = userLocation
      ? userLocation
      : manualCity.trim()
      ? { city: manualCity.trim() }
      : null

    try {
      const response = await sendAssistMessage({
        message: text,
        activeVehicle,
        services: vehicleContextData.services,
        fuelLogs: vehicleContextData.fuelLogs,
        expenses: vehicleContextData.expenses,
        reminders: vehicleContextData.reminders,
        documents: vehicleContextData.documents,
        location: effectiveLoc,
        history: newMessages.slice(-6),
      })

      const botMsgId = 'bot-' + Date.now()
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'assistant',
          data: response.data || {
            shortAnswer: 'I have received your inquiry.',
            suggestedSteps: [],
            relevantRecords: [],
            nearbyPlaces: [],
            suggestedActions: [],
          },
          isFallback: response.isFallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          sender: 'assistant',
          data: {
            shortAnswer:
              'AutoCare Assist encountered an unexpected error. Please check your connection or retry.',
            safetyWarning: null,
            suggestedSteps: ['Retry your question in a moment.'],
            relevantRecords: [],
            nearbyPlaces: [],
            suggestedActions: [],
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Handle in-app action buttons
  const handleActionClick = (action) => {
    if (!action) return
    const { type, payload = {} } = action

    switch (type) {
      case 'VIEW_SERVICES':
        if (onNavigate) onNavigate('services')
        break
      case 'RECORD_SERVICE':
        if (onQuickAction) onQuickAction('service')
        break
      case 'RECORD_FUEL':
        if (onQuickAction) onQuickAction('fuel')
        break
      case 'VIEW_EXPENSES':
        if (onNavigate) onNavigate('expenses')
        break
      case 'OPEN_DOCUMENTS':
        if (onNavigate) onNavigate('documents')
        break
      case 'RENEW_DOCUMENT':
        if (onOpenRenewalModal) {
          onOpenRenewalModal(payload.docType || 'Insurance Policy')
        } else if (onNavigate) {
          onNavigate('documents')
        }
        break
      case 'ADD_REMINDER':
        if (onQuickAction) onQuickAction('reminder')
        break
      case 'PRINT_DOSSIER':
        if (onOpenReportModal) onOpenReportModal()
        break
      case 'FIND_NEARBY': {
        const cat = payload.category || 'garage'
        const matched = ASSISTANCE_CATEGORIES.find((c) => c.id === cat)
        const q = matched ? matched.query : `${cat} vehicle repair`
        const loc = userLocation ? `${userLocation.lat},${userLocation.lng}` : manualCity
        const url = buildGoogleMapsSearchUrl(q, loc)
        window.open(url, '_blank', 'noopener,noreferrer')
        break
      }
      default:
        console.info('Unmapped action click:', action)
    }
  }

  // Clear Session
  const handleClearSession = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        data: {
          shortAnswer:
            'Conversation history cleared. How can I assist you with your vehicle today?',
          safetyWarning: null,
          suggestedSteps: [],
          relevantRecords: [],
          nearbyPlaces: [],
          suggestedActions: [
            { type: 'FIND_NEARBY', label: 'Find Nearby Garages', payload: { category: 'garage' } },
            { type: 'VIEW_SERVICES', label: 'Check Last Service', payload: {} },
          ],
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* 1. Header & Context Indicator */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                  AutoCare Assist
                </h2>
                <Badge variant="blue" className="text-[10px] uppercase font-bold tracking-wider">
                  Gemini 3.5 Flash
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Vehicle problems? Let's find the next step.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Active Vehicle Badge */}
            {activeVehicle ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#17365D]">
                <Car className="w-4 h-4 text-[#2563EB]" />
                <span className="truncate max-w-[150px]">{activeVehicle.name}</span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-[#DC2626]">No vehicle selected</span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSession}
              title="Clear current session messages"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-[#64748B]" />
              Reset
            </Button>
          </div>
        </div>

        {/* Location & Real-World Assistance Bar */}
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#64748B] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              Assistance Location:
            </span>

            {userLocation ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                GPS Coordinates Active ({userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)})
              </span>
            ) : manualCity ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold">
                City: {manualCity}
              </span>
            ) : (
              <span className="text-[#94A3B8]">Not set</span>
            )}

            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={locationDetecting}
              className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#17365D] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {locationDetecting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#2563EB]" />
                  Locating...
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3 text-[#2563EB]" />
                  Use My GPS Location
                </>
              )}
            </button>

            {/* Manual City Fallback Input */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Or enter city/area (e.g. Bangalore)..."
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:border-[#2563EB] w-48 sm:w-56"
              />
            </div>
          </div>

          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            Privacy Protected: Documents & Reg. No. kept private
          </div>
        </div>

        {locationError && (
          <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#B45309] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}
      </div>

      {/* 2. Quick Action Chips */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-2xs">
        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2 px-1">
          Quick Actions & Common Questions
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={loading}
              onClick={() => handleSendMessage(item.label)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                item.emergency
                  ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#17365D] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#2563EB]'
              }`}
            >
              {item.emergency && <Flame className="w-3.5 h-3.5 text-[#DC2626]" />}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Conversation Timeline */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-4 sm:p-6 min-h-[420px] max-h-[620px] overflow-y-auto space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* User Message Bubble */}
            {msg.sender === 'user' ? (
              <div className="max-w-xl bg-[#17365D] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-sm">
                <p className="leading-relaxed">{msg.text}</p>
                <span className="text-[10px] text-slate-300 block text-right mt-1">
                  {msg.timestamp}
                </span>
              </div>
            ) : (
              /* Assistant Structured Response Container */
              <div className="max-w-2xl w-full bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4 text-sm animate-fade-in">
                {/* Assistant Title Header */}
                <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-extrabold text-[#0F172A] text-xs">AutoCare Assist</span>
                    {msg.isFallback && (
                      <Badge variant="amber" className="text-[9px]">
                        Offline Guidance
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-[#94A3B8]">{msg.timestamp}</span>
                </div>

                {/* A. Safety Alert Banner (if applicable) */}
                {msg.data?.safetyWarning && (
                  <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] space-y-1">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                      Safety Priority Alert
                    </div>
                    <p className="text-xs leading-relaxed font-semibold">
                      {msg.data.safetyWarning}
                    </p>
                  </div>
                )}

                {/* B. Short Answer */}
                {msg.data?.shortAnswer && (
                  <p className="text-[#0F172A] leading-relaxed font-medium">
                    {msg.data.shortAnswer}
                  </p>
                )}

                {/* C. Verified Vehicle Records Card */}
                {msg.data?.relevantRecords && msg.data.relevantRecords.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                      Verified AutoCare Records
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.data.relevantRecords.map((rec, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-xs"
                        >
                          <div className="text-[#64748B] text-[10px] font-bold">{rec.label}</div>
                          <div className="font-extrabold text-[#0F172A] mt-0.5">{rec.value}</div>
                          {rec.detail && (
                            <div className="text-[11px] text-[#64748B] mt-0.5 truncate">
                              {rec.detail}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* D. Suggested Steps Checklist */}
                {msg.data?.suggestedSteps && msg.data.suggestedSteps.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-[#17365D]">Recommended Next Steps:</div>
                    <ul className="space-y-1.5 text-xs text-[#334155]">
                      {msg.data.suggestedSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* E. Genuine Nearby Assistance Cards */}
                {msg.data?.nearbyPlaces && msg.data.nearbyPlaces.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-[#F1F5F9]">
                    <div className="text-xs font-bold text-[#17365D] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                      Nearby Assistance Services:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.data.nearbyPlaces.map((place, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-[#CBD5E1] shadow-2xs space-y-2 hover:border-[#2563EB] transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-[#0F172A] text-xs">
                                {place.name}
                              </div>
                              <div className="text-[10px] text-[#64748B] mt-0.5">
                                {place.address}
                              </div>
                            </div>
                            {place.rating && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#FFFBEB] text-[#D97706] text-[10px] font-black shrink-0">
                                ★ {place.rating}
                              </span>
                            )}
                          </div>

                          <a
                            href={
                              place.directionsUrl ||
                              buildGoogleMapsSearchUrl(place.name, userLocation || manualCity)
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs"
                          >
                            <Navigation className="w-3 h-3" />
                            Directions in Google Maps
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* F. In-App Real Action Buttons */}
                {msg.data?.suggestedActions && msg.data.suggestedActions.length > 0 && (
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      Take Action
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {msg.data.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleActionClick(action)}
                          className="px-3 py-1.5 rounded-xl border border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#2563EB] hover:text-white text-xs font-extrabold transition-all shadow-2xs flex items-center gap-1.5"
                        >
                          <span>{action.label}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-white border border-[#E2E8F0] max-w-sm shadow-xs animate-pulse">
            <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
            <span className="text-xs font-semibold text-[#17365D]">
              Querying vehicle context & consulting Gemini...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="bg-white border border-[#E2E8F0] rounded-2xl p-2.5 sm:p-3 shadow-xs flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask a question about your car, overheating, flat tyre, or last service..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!inputMessage.trim() || loading}
          className="rounded-xl shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-1.5" />
              Ask
            </>
          )}
        </Button>
      </form>

      {/* Supported Nearby Searches Footer Grid */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs">
        <div className="text-xs font-bold text-[#17365D] mb-3 flex items-center justify-between">
          <span>Real-World Nearby Assistance Categories</span>
          <span className="text-[10px] font-semibold text-[#64748B]">
            Google Maps Platform Compliant
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ASSISTANCE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                const loc = userLocation ? `${userLocation.lat},${userLocation.lng}` : manualCity
                const url = buildGoogleMapsSearchUrl(cat.query, loc)
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
              className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-all text-left group"
            >
              <div className="text-xs font-bold text-[#17365D] group-hover:text-[#2563EB] flex items-center justify-between">
                <span>{cat.label}</span>
                <ExternalLink className="w-3 h-3 text-[#94A3B8] group-hover:text-[#2563EB]" />
              </div>
              <p className="text-[10px] text-[#64748B] mt-1 line-clamp-1">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
