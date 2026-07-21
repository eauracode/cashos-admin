'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, type BusinessRow } from '@/lib/api'
import { koboToNaira, formatNaira, fmtDate } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'

const selectCls = 'h-9 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 appearance-none pr-7'

function kycBadge(status: string) {
  if (status === 'APPROVED') return <Badge className="bg-emerald-700 text-emerald-100 hover:bg-emerald-700">Approved</Badge>
  if (status === 'REJECTED') return <Badge className="bg-red-800 text-red-100 hover:bg-red-800">Rejected</Badge>
  return <Badge className="bg-amber-700 text-amber-100 hover:bg-amber-700">Pending</Badge>
}

function planBadge(plan: string | null, status: string | null) {
  if (!plan) return <span className="text-gray-600 text-xs">—</span>
  if (status === 'ACTIVE') return <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50 text-xs">Active</Badge>
  if (plan === 'TRIAL' && status === 'TRIALING') return <Badge className="bg-amber-700/30 text-amber-400 hover:bg-amber-700/30 border border-amber-700/50 text-xs">Trial</Badge>
  if (status === 'EXPIRED' || status === 'CANCELLED') return <Badge className="bg-red-800/30 text-red-400 hover:bg-red-800/30 border border-red-700/50 text-xs">{status === 'EXPIRED' ? 'Expired' : 'Cancelled'}</Badge>
  if (status === 'PAST_DUE') return <Badge className="bg-orange-800/30 text-orange-400 hover:bg-orange-800/30 border border-orange-700/50 text-xs">Past due</Badge>
  return <Badge className="bg-gray-700 text-gray-400 hover:bg-gray-700 text-xs">{plan}</Badge>
}

export default function BusinessesPage() {
  const router = useRouter()
  const [data, setData] = useState<BusinessRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [kycStatus, setKycStatus]     = useState('')
  const [onboarded, setOnboarded]     = useState('')
  const [planStatus, setPlanStatus]   = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(val.trim()); setPage(1) }, 350)
  }

  const handleFilter = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value); setPage(1)
  }

  const hasFilters = search || kycStatus || onboarded || planStatus

  useEffect(() => {
    setLoading(true)
    adminApi.businesses(page, search || undefined, kycStatus || undefined, onboarded || undefined, planStatus || undefined)
      .then((res) => {
        setData(res.data)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, search, kycStatus, onboarded, planStatus])

  const from = (page - 1) * 20 + 1
  const to = Math.min(page * 20, total)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Businesses</h1>
          <p className="text-gray-400 text-sm mt-1">All registered businesses on the platform</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Name, email or phone…"
              className="pl-9 h-9 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>

          {/* KYC */}
          <div className="relative">
            <select value={kycStatus} onChange={handleFilter(setKycStatus)} className={selectCls}>
              <option value="">All KYC</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          </div>

          {/* Onboarded */}
          <div className="relative">
            <select value={onboarded} onChange={handleFilter(setOnboarded)} className={selectCls}>
              <option value="">All</option>
              <option value="true">Onboarded</option>
              <option value="false">Not onboarded</option>
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          </div>

          {/* Plan status */}
          <div className="relative">
            <select value={planStatus} onChange={handleFilter(setPlanStatus)} className={selectCls}>
              <option value="">All plans</option>
              <option value="TRIALING">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past due</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setKycStatus(''); setOnboarded(''); setPlanStatus(''); setPage(1) }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium">Business</TableHead>
                <TableHead className="text-gray-400 font-medium">Email</TableHead>
                <TableHead className="text-gray-400 font-medium">Phone</TableHead>
                <TableHead className="text-gray-400 font-medium">State</TableHead>
                <TableHead className="text-gray-400 font-medium">Type</TableHead>
                <TableHead className="text-gray-400 font-medium">Plan</TableHead>
                <TableHead className="text-gray-400 font-medium">KYC</TableHead>
                <TableHead className="text-gray-400 font-medium">Onboarded</TableHead>
                <TableHead className="text-gray-400 font-medium">NUBAN</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Balance</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Inflows</TableHead>
                <TableHead className="text-gray-400 font-medium">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-700">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full bg-gray-700" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                data.map((b) => (
                  <TableRow
                    key={b.id}
                    className="border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => router.push(`/businesses/${b.id}`)}
                  >
                    <TableCell className="text-white font-medium">{b.businessName || <span className="text-gray-500 italic">Unnamed</span>}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{b.ownerEmail ?? <span className="text-gray-600">—</span>}</TableCell>
                    <TableCell className="text-gray-300 font-mono text-sm">{b.ownerPhone ?? <span className="text-gray-600">—</span>}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{b.businessState ?? <span className="text-gray-600">—</span>}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{b.businessType}</TableCell>
                    <TableCell>{planBadge(b.subscriptionPlan, b.subscriptionStatus)}</TableCell>
                    <TableCell>{kycBadge(b.kycStatus)}</TableCell>
                    <TableCell>
                      {b.onboardingComplete
                        ? <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50">Yes</Badge>
                        : <Badge className="bg-gray-700 text-gray-400 hover:bg-gray-700 border border-gray-600">No</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-gray-300 font-mono text-xs">{b.nuban ?? <span className="text-gray-600">—</span>}</TableCell>
                    <TableCell className="text-right text-gray-200 font-medium text-sm">
                      {formatNaira(koboToNaira(b.totalBalanceKobo))}
                    </TableCell>
                    <TableCell className="text-right text-gray-300 text-sm">{b.inflowCount.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-400 text-sm">{fmtDate(b.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            {total > 0 ? `Showing ${from}–${to} of ${total}` : 'No businesses found'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
