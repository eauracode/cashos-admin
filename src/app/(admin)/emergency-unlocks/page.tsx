'use client'

import { useEffect, useState } from 'react'
import { adminApi, type EmergencyUnlockRow } from '@/lib/api'
import { fmtDateTime } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react'

function statusBadge(row: EmergencyUnlockRow) {
  if (row.cancelledAt) return <Badge className="bg-gray-700 text-gray-400 hover:bg-gray-700 text-xs">Cancelled</Badge>
  if (row.confirmedAt) return <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50 text-xs">Confirmed</Badge>
  const coolingEnds = new Date(row.coolingOffEndsAt)
  if (coolingEnds > new Date()) {
    return <Badge className="bg-amber-700/30 text-amber-400 hover:bg-amber-700/30 border border-amber-700/50 text-xs">Cooling off</Badge>
  }
  return <Badge className="bg-red-800/30 text-red-400 hover:bg-red-800/30 border border-red-700/50 text-xs">Ready to unlock</Badge>
}

export default function EmergencyUnlocksPage() {
  const [data, setData] = useState<EmergencyUnlockRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pendingOnly, setPendingOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminApi.emergencyUnlocks(page, pendingOnly)
      .then((res) => {
        setData(res.data)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, pendingOnly])

  const pageSize = data.length || 50
  const from = total > 0 ? (page - 1) * pageSize + 1 : 0
  const to = Math.min((page - 1) * pageSize + pageSize, total)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Emergency Unlocks</h1>
            <p className="text-gray-400 text-sm mt-0.5">All emergency wallet unlock requests across all businesses</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setPendingOnly(v => !v); setPage(1) }}
          className={`border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent ${pendingOnly ? 'border-red-500 text-red-400' : ''}`}
        >
          {pendingOnly ? 'Showing pending only' : 'All requests'}
        </Button>
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
                <TableHead className="text-gray-400">Requested</TableHead>
                <TableHead className="text-gray-400">Business</TableHead>
                <TableHead className="text-gray-400">Wallet</TableHead>
                <TableHead className="text-gray-400">Reason</TableHead>
                <TableHead className="text-gray-400">Cooling off ends</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-700">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full bg-gray-700" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="border-gray-700">
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    {pendingOnly ? 'No pending emergency unlock requests' : 'No emergency unlock requests found'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((u) => (
                  <TableRow key={u.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-gray-400 text-sm whitespace-nowrap">{fmtDateTime(u.createdAt)}</TableCell>
                    <TableCell>
                      <p className="text-white text-sm font-medium">{u.businessName}</p>
                      <p className="text-gray-500 text-xs">{u.ownerEmail ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: u.purseColor }} />
                        <span className="text-gray-200 text-sm">{u.purseLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm max-w-xs">
                      <p className="truncate">{u.reason}</p>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm whitespace-nowrap">{fmtDateTime(u.coolingOffEndsAt)}</TableCell>
                    <TableCell>{statusBadge(u)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <p className="text-gray-400 text-sm">
            {total > 0 ? `Showing ${from}–${to} of ${total}` : 'No records'}
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
