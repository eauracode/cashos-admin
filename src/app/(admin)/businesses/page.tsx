'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, type BusinessRow } from '@/lib/api'
import { koboToNaira, formatNaira, fmtDate } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function kycBadge(status: string) {
  if (status === 'APPROVED') return <Badge className="bg-emerald-700 text-emerald-100 hover:bg-emerald-700">Approved</Badge>
  if (status === 'REJECTED') return <Badge className="bg-red-800 text-red-100 hover:bg-red-800">Rejected</Badge>
  return <Badge className="bg-amber-700 text-amber-100 hover:bg-amber-700">Pending</Badge>
}

export default function BusinessesPage() {
  const router = useRouter()
  const [data, setData] = useState<BusinessRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    adminApi.businesses(page)
      .then((res) => {
        setData(res.data)
        setTotal(res.total)
        setPages(res.pages)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  const from = (page - 1) * 20 + 1
  const to = Math.min(page * 20, total)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Businesses</h1>
        <p className="text-gray-400 text-sm mt-1">All registered businesses on the platform</p>
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
                    {Array.from({ length: 11 }).map((_, j) => (
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
