import React, { useState, useEffect } from 'react'
import { useVehicles } from '../../context/VehicleContext'
import { useAuth } from '../../context/AuthContext'
import { getVehicleTimeline } from '../../lib/storage'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import {
  History,
  Wrench,
  Fuel,
  Receipt,
  FileText,
  CheckCircle2,
  Gauge,
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../lib/utils'

export function VehicleTimeline() {
  const { currency } = useAuth()
  const { activeVehicle } = useVehicles()

  const [timelineEvents, setTimelineEvents] = useState([])
  const [filterType, setFilterType] = useState('all') // 'all' | 'service' | 'fuel' | 'expense' | 'document'

  useEffect(() => {
    async function loadTimeline() {
      if (!activeVehicle) {
        setTimelineEvents([])
        return
      }
      try {
        const events = await getVehicleTimeline(activeVehicle.id)
        setTimelineEvents(events)
      } catch (e) {
        console.error(e)
      }
    }
    loadTimeline()
  }, [activeVehicle?.id])

  if (!activeVehicle) {
    return (
      <EmptyState
        icon={History}
        title="No vehicle selected"
        description="Select a vehicle to view its complete chronological ownership timeline."
      />
    )
  }

  const filteredEvents =
    filterType === 'all'
      ? timelineEvents
      : timelineEvents.filter((e) => e.type === filterType)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Ownership Timeline
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Automatically assembled chronological lifetime story for{' '}
            <span className="font-semibold text-[#0F172A]">{activeVehicle.name}</span>.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0]">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'service', label: 'Services' },
            { id: 'fuel', label: 'Fuel' },
            { id: 'expense', label: 'Expenses' },
            { id: 'document', label: 'Documents' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterType === tab.id
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={History}
          title="No timeline events recorded yet"
          description={`Log service visits, fill-ups, or documents for ${activeVehicle.name} to see the automated chronological history unfold.`}
        />
      ) : (
        <div className="relative pl-7 sm:pl-9 border-l-2 border-[#CBD5E1] space-y-6 my-4 ml-3 sm:ml-4">
          {filteredEvents.map((event) => {
            let IconComponent = Wrench
            let iconBg = 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]'

            if (event.type === 'fuel') {
              IconComponent = Fuel
              iconBg = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
            } else if (event.type === 'expense') {
              IconComponent = Receipt
              iconBg = 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
            } else if (event.type === 'document') {
              IconComponent = FileText
              iconBg = 'bg-[#FAF5FF] text-[#7C3AED] border-[#E9D5FF]'
            } else if (event.type === 'reminder') {
              IconComponent = CheckCircle2
              iconBg = 'bg-[#F0FDFA] text-[#0D9488] border-[#99F6E4]'
            }

            return (
              <div key={event.id} className="relative group">
                {/* Node icon on line */}
                <div
                  className={`absolute -left-[43px] sm:-left-[51px] top-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${iconBg}`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                <Card hoverable className="transition-all">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                            {event.title}
                          </h3>
                          <Badge variant="primary">{formatDate(event.date)}</Badge>
                          {event.odometer && (
                            <Badge variant="neutral">
                              <Gauge className="w-3.5 h-3.5 mr-1 inline" />
                              {Number(event.odometer).toLocaleString()} km
                            </Badge>
                          )}
                        </div>

                        {event.subtitle && (
                          <p className="text-xs sm:text-sm text-[#475569]">{event.subtitle}</p>
                        )}

                        {event.notes && (
                          <p className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mt-2">
                            {event.notes}
                          </p>
                        )}
                      </div>

                      {event.cost !== undefined && event.cost !== null && Number(event.cost) > 0 && (
                        <div className="text-base sm:text-lg font-extrabold text-[#0F172A] shrink-0">
                          {formatCurrency(event.cost, currency)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
