'use client'

import { useEffect, useState } from 'react'
import { adminApi, type InflowRow } from '@/lib/api'
import { koboToNaira, formatNaira, fmtDateTime } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function TransactionsPage() {
  const [data, setData] = useState<InflowRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminApi.inflows(page)
      .then((res) => {
        setData(res.data)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  const limit = 50
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400 text-sm mt-1">All inflows across all businesses</p>
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
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">No transactions found</TableCell>
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
