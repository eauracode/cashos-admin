'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Building2, CheckCircle, TrendingUp, DollarSign } from 'lucide-react'
import { adminApi, type AdminStats } from '@/lib/api'
import { koboToNaira, formatNaira } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function KpiCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <Skeleton className="h-4 w-32 mb-3 bg-gray-700" />
      <Skeleton className="h-8 w-24 bg-gray-700" />
    </div>
  )
}

// Fill in missing dates in the daily inflow series
function buildChartData(dailyInflows: { date: string; amountKobo: string }[]) {
  const map: Record<string, number> = {}
  for (const d of dailyInflows) {
    map[d.date] = (map[d.date] ?? 0) + koboToNaira(d.amountKobo)
  }
  const result = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
    result.push({ date: label, amount: map[iso] ?? 0 })
  }
  return result
}

const tickFmt = (v: number) => formatNaira(v, true)

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
  }, [])

  const chartData = useMemo(() => stats ? buildChartData(stats.dailyInflows) : [], [stats])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform overview</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {/* KPI cards — row 1: platform */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {!stats ? (
          <>
            <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              title="Total Businesses"
              value={stats.totalBusinesses.toLocaleString()}
              icon={Building2}
              accent="bg-blue-600"
            />
            <KpiCard
              title="Onboarded"
              value={stats.onboardedBusinesses.toLocaleString()}
              icon={CheckCircle}
              accent="bg-emerald-600"
            />
            <KpiCard
              title="Revenue Processed"
              value={formatNaira(koboToNaira(stats.totalInflowKobo), true)}
              icon={TrendingUp}
              accent="bg-emerald-700"
            />
            <KpiCard
              title="Funds Under Management"
              value={formatNaira(koboToNaira(stats.fundsUnderManagementKobo), true)}
              icon={DollarSign}
              accent="bg-indigo-600"
            />
          </>
        )}
      </div>

      {/* Daily volume chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-1">Daily Revenue Volume</h2>
        <p className="text-gray-400 text-xs mb-6">Last 14 days (allocated inflows)</p>

        {!stats ? (
          <Skeleton className="h-64 w-full bg-gray-700" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={tickFmt}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => [formatNaira(Number(v ?? 0)), 'Revenue']}
                  contentStyle={{
                    background: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    color: '#F9FAFB',
                    fontSize: 13,
                  }}
                  cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                />
                <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
