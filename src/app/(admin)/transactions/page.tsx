'use client'

import { useEffect, useState, useRef } from 'react'
import { adminApi, type InflowRow } from '@/lib/api'
import { koboToNaira, formatNaira, fmtDateTime } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

const CHANNELS = ['BANK_TRANSFER', 'POS', 'CASH', 'ONLINE']
const STATUSES = [
  { value: 'allocated', label: 'Allocated' },
  { value: 'pending',   label: 'Pending' },
  { value: 'undone',    label: 'Undone' },
]

const selectCls = 'h-9 rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 appearance-none pr-8 bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem]'

export default function TransactionsPage() {
  const [data, setData]   = useState<InflowRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [channel, setChannel]         = useState('')
  const [status, setStatus]           = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(val.trim()); setPage(1) }, 350)
  }

  const handleFilter = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value); setPage(1)
  }

  useEffect(() => {
    setLoading(true)
    adminApi.inflows(page, search || undefined, channel || undefined, status || undefined)
      .then((res) => { setData(res.data); setTotal(res.total); setPages(res.pages) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, search, channel, status])

  const limit = 50
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const hasFilters = search || channel || status

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 text-sm mt-1">All inflows across all businesses</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Business, payer, ref…"
              className="pl-9 h-9 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>

          {/* Channel */}
          <div className="relative">
            <select value={channel} onChange={handleFilter(setChannel)} className={selectCls}>
              <option value="">All channels</option>
              {CHANNELS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
          </div>

          {/* Status */}
          <div className="relative">
            <select value={status} onChange={handleFilter(setStatus)} className={selectCls}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setChannel(''); setStatus(''); setPage(1) }}
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
                <TableHead className="text-gray-400">Date / Time</TableHead>
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-gray-400">Channel</TableHead>
                <TableHead className="text-gray-400">Payer</TableHead>
                <TableHead className="text-gray-400">Reference</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-700">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full bg-gray-700" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="border-gray-700">
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    {hasFilters ? 'No transactions match your filters' : 'No transactions found'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((i) => (
                  <TableRow key={i.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-gray-400 text-sm whitespace-nowrap">{fmtDateTime(i.createdAt)}</TableCell>
                    <TableCell>
                      <p className="text-white text-sm font-medium">{i.businessName || 'Unnamed'}</p>
                      <p className="text-gray-500 text-xs font-mono">{i.ownerPhone}</p>
                    </TableCell>
                    <TableCell className="text-right text-gray-200 font-medium text-sm whitespace-nowrap">
                      {formatNaira(koboToNaira(i.amountKobo))}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">{i.channel}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{i.payer ?? <span className="text-gray-600">—</span>}</TableCell>
                    <TableCell className="text-gray-400 text-xs font-mono">{i.reference ?? <span className="text-gray-600">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {i.allocated
                          ? <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50 text-xs">Allocated</Badge>
                          : <Badge className="bg-gray-700 text-gray-400 hover:bg-gray-700 text-xs">Pending</Badge>
                        }
                        {i.undone && (
                          <Badge className="bg-red-800/30 text-red-400 hover:bg-red-800/30 border border-red-700/50 text-xs">Undone</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            {total > 0 ? `Showing ${from}–${to} of ${total}` : 'No transactions'}
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
