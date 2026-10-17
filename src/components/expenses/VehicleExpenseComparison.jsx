import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import {
  Car,
  Bike,
  Trophy,
  TrendingUp,
  DollarSign,
  Fuel,
  Wrench,
  Gauge,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { formatCurrency, calculateVehicleExpenseComparison } from '../../lib/utils'

const VEHICLE_COLORS = [
  '#2563EB', // Royal Blue (Rank 1 / Highest)
  '#0D9488', // Teal (Rank 2)
  '#D97706', // Amber (Rank 3)
  '#7C3AED', // Purple (Rank 4)
  '#DC2626', // Red (Rank 5)
  '#64748B', // Slate (Rank 6)
]

const TIMEFRAME_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'year', label: 'Past 12 Months' },
  { id: '6months', label: 'Past 6 Months' },
  { id: '30days', label: 'Past 30 Days' },
]

export function VehicleExpenseComparison({
  vehicles = [],
  allExpenses = [],
  currency = 'USD',
  activeVehicleId = null,
  onSelectVehicle = () => {},
  onOpenAddVehicle = () => {},
  onSeedDemoData = () => {},
}) {
  const [timeframe, setTimeframe] = useState('all')

  const comparison = useMemo(() => {
    return calculateVehicleExpenseComparison(vehicles, allExpenses, timeframe, currency)
  }, [vehicles, allExpenses, timeframe, currency])

  const {
    ranking,
    highestVehicle,
    lowestVehicle,
    runnerUpVehicle,
    totalFleetSpent,
    avgSpent,
    categoryComparison,
    insights,
    filteredExpenseCount,
  } = comparison

  // If user has fewer than 2 vehicles
  if (vehicles.length < 2) {
    return (
      <Card className="border-dashed border-2 border-[#CBD5E1]">
        <CardContent className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto border border-[#DBEAFE] shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
              Compare Multiple Vehicles
            </h3>
            <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
              You currently have {vehicles.length === 1 ? `1 vehicle (${vehicles[0].name})` : '0 vehicles'} in your garage.
              Register at least two vehicles to unlock side-by-side expense comparisons, spend differences, and cost driver analytics.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="sm" onClick={onOpenAddVehicle}>
              <Car className="w-4 h-4 mr-1.5" />
              Add Second Vehicle
            </Button>
            <Button variant="outline" size="sm" onClick={onSeedDemoData}>
              <Sparkles className="w-4 h-4 mr-1.5 text-[#2563EB]" />
              Load Sample Fleet (Car & Bike)
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Custom Tooltip for Recharts
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#0F172A] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700">
          <div className="font-bold text-slate-200">{data.name}</div>
          <div className="text-sm font-extrabold mt-0.5 text-white">
            {formatCurrency(data.totalSpent, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rank #{data.rank} • {data.percentageShare}% of fleet spend
          </div>
        </div>
      )
    }
    return null
  }

  // Custom Tooltip for Category Comparison
  const CustomCategoryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700 space-y-1">
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">{label}</div>
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold text-white">
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Timeframe Selector & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] px-1">
          <Calendar className="w-4 h-4 text-[#2563EB]" />
          <span>Comparing expenses for {ranking.length} vehicles</span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="text-[#64748B]">{filteredExpenseCount} records</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {TIMEFRAME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTimeframe(opt.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                timeframe === opt.id
                  ? 'bg-[#17365D] text-white shadow-2xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* HIGHEST EXPENSE VEHICLE SPOTLIGHT HERO */}
      {highestVehicle && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#17365D] text-white p-6 sm:p-8 shadow-xl border border-slate-700/60">
          {/* Subtle background glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#EF4444]/20 text-[#FCA5A5] border border-[#EF4444]/30 uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5 text-[#F87171]" />
                  Highest Expense Vehicle
                </span>
                <span className="text-xs text-slate-400">
                  Rank #1 in fleet expenditure
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  {highestVehicle.type === 'motorcycle' || highestVehicle.type === 'scooter' ? (
                    <Bike className="w-7 h-7 text-blue-300" />
                  ) : (
                    <Car className="w-7 h-7 text-blue-300" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
                    {highestVehicle.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 mt-1">
                    <span>
                      {highestVehicle.year} {highestVehicle.make} {highestVehicle.model}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-slate-200">
                      {highestVehicle.license_plate || 'No Plate'}
                    </span>
                    {highestVehicle.costPerKm !== null && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-blue-300 font-semibold">
                          {formatCurrency(highestVehicle.costPerKm, currency)} / km
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparison Differential Callout */}
              {runnerUpVehicle && runnerUpVehicle.id !== highestVehicle.id && (
                <div className="pt-2 text-xs sm:text-sm text-slate-200 flex flex-wrap items-center gap-2">
                  <span>Incurs</span>
                  <span className="font-extrabold text-[#38BDF8] text-base sm:text-lg">
                    {formatCurrency(highestVehicle.totalSpent - runnerUpVehicle.totalSpent, currency)}
                    {highestVehicle.moreThanNext?.percentage !== null && (
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        +{highestVehicle.moreThanNext?.percentage}%
                      </span>
                    )}
                  </span>
                  <span>more than second-ranked</span>
                  <span className="font-bold text-white underline decoration-blue-400/50 underline-offset-2">
                    {runnerUpVehicle.name}
                  </span>
                  <span>({formatCurrency(runnerUpVehicle.totalSpent, currency)}).</span>
                </div>
              )}
            </div>

            {/* Total Metric & Action */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-700/60 shrink-0">
              <div className="lg:text-right">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                  Total Vehicle Spend
                </span>
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight block mt-0.5">
                  {formatCurrency(highestVehicle.totalSpent, currency)}
                </span>
                <span className="text-xs text-slate-300 font-medium block mt-1">
                  {highestVehicle.percentageShare}% of total garage costs
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeVehicleId === highestVehicle.id ? (
                  <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Currently Active
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectVehicle(highestVehicle.id)}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-bold"
                  >
                    Select as Active Vehicle
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fleet Spend */}
        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Total Fleet Spend
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight block">
                {formatCurrency(totalFleetSpent, currency)}
              </span>
              <span className="text-[11px] text-[#64748B] block truncate mt-0.5">
                Across {ranking.length} vehicles
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Highest vs Lowest Spread */}
        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Expense Spread (Max vs Min)
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight block">
                {highestVehicle && lowestVehicle
                  ? formatCurrency(highestVehicle.totalSpent - lowestVehicle.totalSpent, currency)
                  : '$0.00'}
              </span>
              <span className="text-[11px] text-[#64748B] block truncate mt-0.5">
                {highestVehicle && lowestVehicle && lowestVehicle.id !== highestVehicle.id
                  ? `${highestVehicle.name} vs ${lowestVehicle.name}`
                  : 'Single comparison'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Average */}
        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#17365D] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Average Spend / Vehicle
              </span>
              <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight block">
                {formatCurrency(avgSpent, currency)}
              </span>
              <span className="text-[11px] text-[#64748B] block truncate mt-0.5">
                Garage benchmark
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Most Economical Vehicle */}
        <Card hoverable>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#64748B] block truncate">
                Most Economical Vehicle
              </span>
              <span className="text-xl font-extrabold text-[#0F172A] tracking-tight block truncate">
                {lowestVehicle?.name || 'N/A'}
              </span>
              <span className="text-[11px] text-[#059669] font-bold block truncate mt-0.5">
                {formatCurrency(lowestVehicle?.totalSpent || 0, currency)} total spend
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AUTOMATED INSIGHTS CARDS */}
      {insights.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider px-1">
            Comparative Takeaways
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-2xs ${
                  ins.type === 'primary'
                    ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E3A8A]'
                    : ins.type === 'economy'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                    : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {ins.type === 'primary' ? (
                    <Trophy className="w-4 h-4 text-[#2563EB]" />
                  ) : ins.type === 'economy' ? (
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-[#D97706]" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-[13px]">{ins.title}</div>
                  <div className="mt-0.5 leading-relaxed opacity-90">{ins.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Vehicle Total Spend Comparison */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Total Spend by Vehicle</CardTitle>
              <span className="text-xs text-[#64748B]">Ranked by total cost</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="totalSpent" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {ranking.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Category Breakdown by Vehicle */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Category Spend Across Vehicles</CardTitle>
              <span className="text-xs text-[#64748B]">Direct category comparison</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2 p-6">
            {categoryComparison.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryComparison}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip content={<CustomCategoryTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(val) => {
                        const v = ranking.find((r) => r.id === val)
                        return <span className="text-xs text-[#475569] font-medium">{v ? v.name : val}</span>
                      }}
                    />
                    {ranking.map((veh, idx) => (
                      <Bar
                        key={veh.id}
                        dataKey={veh.id}
                        name={veh.name}
                        fill={VEHICLE_COLORS[idx % VEHICLE_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-[#94A3B8]">
                No category data available for the chosen timeframe.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DETAILED RANKED CARDS */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
            Detailed Cost Breakdown & Comparative Rank
          </h3>
          <span className="text-xs text-[#64748B]">
            From highest to lowest expense
          </span>
        </div>

        <div className="space-y-3.5">
          {ranking.map((v, index) => {
            const isHighest = index === 0
            const isLowest = index === ranking.length - 1 && ranking.length > 1
            const barFill = VEHICLE_COLORS[index % VEHICLE_COLORS.length]

            return (
              <Card
                key={v.id}
                className={`transition-all duration-200 overflow-hidden ${
                  isHighest
                    ? 'border-[#2563EB]/40 ring-1 ring-[#2563EB]/20 bg-gradient-to-r from-white via-white to-[#EFF6FF]/30'
                    : 'hover:border-[#CBD5E1]'
                }`}
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm text-white shadow-xs"
                        style={{ backgroundColor: barFill }}
                      >
                        #{v.rank}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-extrabold text-[#0F172A] truncate">
                            {v.name}
                          </span>
                          {isHighest && (
                            <Badge variant="danger" className="text-[11px] font-bold">
                              Highest Expense
                            </Badge>
                          )}
                          {isLowest && (
                            <Badge variant="success" className="text-[11px] font-bold">
                              Most Economical
                            </Badge>
                          )}
                          <Badge variant="neutral" className="text-[11px]">
                            {v.type?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-[#64748B] mt-0.5 flex flex-wrap items-center gap-2">
                          <span>
                            {v.year} {v.make} {v.model}
                          </span>
                          <span className="text-[#CBD5E1]">•</span>
                          <span className="font-mono text-[#334155]">{v.license_plate || 'No Plate'}</span>
                          {v.costPerKm !== null && (
                            <>
                              <span className="text-[#CBD5E1]">•</span>
                              <span className="font-semibold text-[#17365D]">
                                {formatCurrency(v.costPerKm, currency)}/km
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spend & Delta Badge */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                      <div className="sm:text-right">
                        <span className="text-xs text-[#64748B] font-semibold block">Total Spent</span>
                        <span className="text-2xl font-black text-[#0F172A] tracking-tight block">
                          {formatCurrency(v.totalSpent, currency)}
                        </span>
                        <span className="text-[11px] text-[#64748B] block mt-0.5">
                          {v.percentageShare}% of fleet
                        </span>
                      </div>

                      <div>
                        {activeVehicleId === v.id ? (
                          <span className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] text-[#1E40AF] text-xs font-bold border border-[#BFDBFE] flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> In Focus
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectVehicle(v.id)}
                            className="text-xs font-semibold"
                          >
                            Focus
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visual Share Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>Relative Garage Cost Share</span>
                      <span className="font-bold text-[#0F172A]">{v.percentageShare}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(v.percentageShare, 4)}%`,
                          backgroundColor: barFill,
                        }}
                      />
                    </div>
                  </div>

                  {/* Comparative Differential Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    {/* 1. Comparison vs Next Vehicle */}
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] font-semibold block">Comparison vs Next</span>
                      {v.moreThanNext ? (
                        <div className="mt-1 font-bold text-[#0F172A]">
                          <span className="text-[#DC2626] font-extrabold">
                            +{formatCurrency(v.moreThanNext.difference, currency)}
                          </span>{' '}
                          {v.moreThanNext.percentage !== null && `(+${v.moreThanNext.percentage}%) `}
                          more than {v.moreThanNext.name}
                        </div>
                      ) : (
                        <div className="mt-1 text-[#059669] font-bold">
                          Lowest expense in garage (benchmark)
                        </div>
                      )}
                    </div>

                    {/* 2. Primary Cost Driver */}
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] font-semibold block">Primary Expense Driver</span>
                      {v.topCategory ? (
                        <div className="mt-1 font-bold text-[#0F172A] truncate">
                          {v.topCategory.name}:{' '}
                          <span className="font-extrabold text-[#17365D]">
                            {formatCurrency(v.topCategory.amount, currency)}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 text-[#64748B]">No expenses recorded</div>
                      )}
                    </div>

                    {/* 3. Recorded Entries & Distance */}
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[#64748B] font-semibold block">Ledger Activity</span>
                      <div className="mt-1 font-bold text-[#0F172A]">
                        {v.expenseCount} logs recorded
                        {v.current_odometer ? ` • ${v.current_odometer.toLocaleString()} km odo` : ''}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* CATEGORY COMPARISON TABLE */}
      {categoryComparison.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Category-by-Category Spend Matrix</CardTitle>
              <span className="text-xs text-[#64748B]">
                Identifies which vehicle outspent others across specific expense categories
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#64748B] font-bold">
                    <th className="py-3 px-5">Expense Category</th>
                    <th className="py-3 px-5">Total Fleet Cost</th>
                    <th className="py-3 px-5">Highest Spender</th>
                    {ranking.map((v) => (
                      <th key={v.id} className="py-3 px-5 text-right">
                        {v.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {categoryComparison.map((catRow) => (
                    <tr key={catRow.category} className="hover:bg-[#F8FAFC]/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-[#0F172A]">
                        {catRow.category}
                      </td>
                      <td className="py-3.5 px-5 font-extrabold text-[#17365D]">
                        {formatCurrency(catRow.total, currency)}
                      </td>
                      <td className="py-3.5 px-5">
                        {catRow.highestSpender ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#2563EB]">
                            {catRow.highestSpender.name} ({formatCurrency(catRow.highestSpender.amount, currency)})
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      {ranking.map((v) => {
                        const amount = catRow[v.id] || 0
                        const isHighestForCat = catRow.highestSpender?.id === v.id && amount > 0
                        return (
                          <td
                            key={v.id}
                            className={`py-3.5 px-5 text-right font-mono ${
                              isHighestForCat
                                ? 'font-black text-[#0F172A] bg-blue-50/50'
                                : 'text-[#64748B]'
                            }`}
                          >
                            {formatCurrency(amount, currency)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
