'use client'

import { useEffect, useState, useRef } from 'react'
import { adminApi, type SpendRow } from '@/lib/api'
import { koboToNaira, formatNaira, fmtDateTime } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MinusCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function SpendsPage() {
  const [data, setData]   = useState<SpendRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(val.trim()); setPage(1) }, 350)
  }

  useEffect(() => {
    setLoading(true)
    adminApi.spends(page, search || undefined)
      .then((res) => {
        setData(res.data)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, search])

  const pageSize = data.length || 50
  const from = total > 0 ? (page - 1) * pageSize + 1 : 0
  const to = Math.min((page - 1) * pageSize + pageSize, total)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <MinusCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Spend Records</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manual spend entries recorded by businesses from their wallets</p>
          </div>
        </div>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Business, wallet, description…"
            className="pl-9 h-9 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
          />
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
                <TableHead className="text-gray-400">Date / Time</TableHead>
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400">Wallet</TableHead>
                <TableHead className="text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-gray-400">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-700">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full bg-gray-700" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="border-gray-700">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-12">
                    {search ? 'No spend records match your search' : 'No spend records found'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((s) => (
                  <TableRow key={s.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-gray-400 text-sm whitespace-nowrap">{fmtDateTime(s.createdAt)}</TableCell>
                    <TableCell className="text-white font-medium text-sm">{s.businessName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.purseColor }} />
                        <span className="text-gray-200 text-sm">{s.purseLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-red-400 font-medium text-sm whitespace-nowrap">
                      -{formatNaira(koboToNaira(s.amountKobo))}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm max-w-xs">
                      <p className="truncate">{s.description || <span className="text-gray-600 italic">No description</span>}</p>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            {total > 0 ? `Showing ${from}–${to} of ${total}` : 'No spend records'}
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
