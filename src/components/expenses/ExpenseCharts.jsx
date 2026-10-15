import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { formatCurrency } from '../../lib/utils'

const CATEGORY_COLORS = [
  '#17365D', // Deep Navy
  '#2563EB', // Royal Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#0D9488', // Teal
  '#64748B', // Slate
]

export function ExpenseCharts({ summary, currency = 'USD' }) {
  const { monthlyTotals, categoryChartData } = summary

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700">
          <div className="font-semibold text-slate-300">{label}</div>
          <div className="text-sm font-bold mt-0.5 text-white">
            {formatCurrency(payload[0].value, currency)}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700">
          <div className="font-semibold text-slate-300">{payload[0].name}</div>
          <div className="text-sm font-bold mt-0.5 text-white">
            {formatCurrency(payload[0].value, currency)}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Monthly Spend Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spend Trend</CardTitle>
          <span className="text-xs text-[#64748B]">Past 6 months</span>
        </CardHeader>
        <CardContent className="pt-2 p-6">
          {monthlyTotals && monthlyTotals.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTotals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
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
                  <Bar
                    dataKey="amount"
                    fill="#17365D"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-[#94A3B8]">
              Not enough expense history to generate monthly trends.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <span className="text-xs text-[#64748B]">Proportional distribution</span>
        </CardHeader>
        <CardContent className="pt-2 p-6">
          {categoryChartData && categoryChartData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-60 w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with amounts and percentages */}
              <div className="w-full sm:w-1/2 space-y-2 text-xs max-h-56 overflow-y-auto pr-1">
                {categoryChartData.map((item, idx) => {
                  const total = summary.totalSpent || 1
                  const pct = ((item.value / total) * 100).toFixed(0)
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="text-[#334155] truncate font-semibold">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-[#0F172A]">
                          {formatCurrency(item.value, currency)}
                        </span>
                        <span className="text-[11px] text-[#64748B] w-8 text-right font-medium">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-[#94A3B8]">
              No expenses recorded yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
