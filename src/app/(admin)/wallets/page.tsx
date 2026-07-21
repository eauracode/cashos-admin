'use client'

import { useEffect, useState, useRef } from 'react'
import { adminApi, type WalletRow } from '@/lib/api'
import { koboToNaira, formatNaira } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'

const selectCls = 'h-9 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 appearance-none pr-7'

const PURSE_TYPES = ['COGS', 'SAFE_TO_SPEND', 'OBLIGATION', 'TAX']

function lockBadge(state: string) {
  if (state === 'LOCKED') return <Badge className="bg-gray-700 text-gray-300 hover:bg-gray-700">Locked</Badge>
  if (state === 'RELEASED' || state === 'PAID_OUT') return <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50">{state}</Badge>
  if (state === 'EMERGENCY_REQUESTED' || state === 'EMERGENCY_RELEASED') return <Badge className="bg-red-800/30 text-red-400 hover:bg-red-800/30 border border-red-700/50">{state}</Badge>
  return <Badge className="bg-amber-700/30 text-amber-400 hover:bg-amber-700/30 border border-amber-700/50">{state}</Badge>
}

export default function WalletsPage() {
  const [data, setData]   = useState<WalletRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [purseType, setPurseType]     = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(val.trim()); setPage(1) }, 350)
  }

  const hasFilters = search || purseType

  useEffect(() => {
    setLoading(true)
    adminApi.wallets(page, search || undefined, purseType || undefined)
      .then((res) => { setData(res.data); setTotal(res.total); setPages(res.pages) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, search, purseType])

  const limit = 50
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallets</h1>
          <p className="text-gray-400 text-sm mt-1">All purses / wallets across all businesses</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Business or wallet name…"
              className="pl-9 h-9 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>

          <div className="relative">
            <select value={purseType} onChange={(e) => { setPurseType(e.target.value); setPage(1) }} className={selectCls}>
              <option value="">All types</option>
              {PURSE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <SlidersHorizontal className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPurseType(''); setPage(1) }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm mb-6">{error}</div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400">Wallet Label</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400 text-right">Balance</TableHead>
                <TableHead className="text-gray-400 text-right">Allocation</TableHead>
                <TableHead className="text-gray-400">Lock State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-700">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full bg-gray-700" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="border-gray-700">
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    {hasFilters ? 'No wallets match your filters' : 'No wallets found'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((p) => (
                  <TableRow key={p.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-gray-300 font-medium text-sm">{p.businessName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-white font-medium">{p.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">{p.purseType}</TableCell>
                    <TableCell className="text-right text-gray-200 font-medium text-sm">
                      {formatNaira(koboToNaira(p.balanceKobo))}
                    </TableCell>
                    <TableCell className="text-right text-gray-300 text-sm">
                      {(p.allocationBps / 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>{lockBadge(p.lockState)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            {total > 0 ? `Showing ${from}–${to} of ${total}` : 'No wallets'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent">
              <ChevronLeft className="w-4 h-4" />Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent">
              Next<ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
