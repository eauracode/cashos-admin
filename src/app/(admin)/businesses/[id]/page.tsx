'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi, type BusinessDetail } from '@/lib/api'
import { koboToNaira, formatNaira, fmtDate, fmtDateTime } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, CreditCard, BarChart2 } from 'lucide-react'
import type { BusinessSubscription, BusinessSalesProfile } from '@/lib/api'

function planBadge(plan: string, status: string) {
  if (status === 'ACTIVE') return <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50">Active — {plan}</Badge>
  if (plan === 'TRIAL' && status === 'TRIALING') return <Badge className="bg-amber-700/30 text-amber-400 hover:bg-amber-700/30 border border-amber-700/50">Trialing</Badge>
  if (status === 'EXPIRED') return <Badge className="bg-red-800/30 text-red-400 hover:bg-red-800/30 border border-red-700/50">Expired</Badge>
  if (status === 'CANCELLED') return <Badge className="bg-red-800/30 text-red-400 hover:bg-red-800/30 border border-red-700/50">Cancelled</Badge>
  if (status === 'PAST_DUE') return <Badge className="bg-orange-800/30 text-orange-400 hover:bg-orange-800/30 border border-orange-700/50">Past Due</Badge>
  return <Badge className="bg-gray-700 text-gray-400 hover:bg-gray-700">{status}</Badge>
}

function SubscriptionSection({ sub }: { sub: BusinessSubscription | null }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-4 h-4 text-indigo-400" />
        <h2 className="text-white font-semibold">Billing</h2>
      </div>
      {!sub ? (
        <p className="text-gray-500 text-sm italic">No subscription record yet (business not yet onboarded).</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            {planBadge(sub.plan, sub.status)}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Plan</p>
            <p className="text-gray-200 text-sm">{sub.plan}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Trial ends</p>
            <p className="text-gray-200 text-sm">{sub.trialEndsAt ? fmtDate(sub.trialEndsAt) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Current period end</p>
            <p className="text-gray-200 text-sm">{sub.currentPeriodEnd ? fmtDate(sub.currentPeriodEnd) : '—'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function fmt(kobo: string | null) {
  if (!kobo) return '—'
  return formatNaira(koboToNaira(kobo))
}

function SalesProfileSection({ profile }: { profile: BusinessSalesProfile }) {
  const hasData = profile.avgMonthlySalesUnits !== null || profile.avgSaleAvgKobo !== null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-indigo-400" />
        <h2 className="text-white font-semibold">Sales Profile (Onboarding)</h2>
      </div>
      {!hasData ? (
        <p className="text-gray-500 text-sm italic">Sales profile not yet completed.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Avg monthly sales</p>
            <p className="text-gray-200 text-sm">{profile.avgMonthlySalesUnits?.toLocaleString() ?? '—'} units</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Avg sale amount</p>
            <p className="text-gray-200 text-sm">{fmt(profile.avgSaleAvgKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Sale range</p>
            <p className="text-gray-200 text-sm">{fmt(profile.avgSaleMinKobo)} – {fmt(profile.avgSaleMaxKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">COGS %</p>
            <p className="text-gray-200 text-sm">{profile.cogsPct !== null ? `${profile.cogsPct}%` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Monthly rent</p>
            <p className="text-gray-200 text-sm">{fmt(profile.rentMonthlyKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Monthly salaries</p>
            <p className="text-gray-200 text-sm">{fmt(profile.salariesMonthlyKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Monthly debt repay</p>
            <p className="text-gray-200 text-sm">{fmt(profile.debtMonthlyKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Owner&apos;s pay</p>
            <p className="text-gray-200 text-sm">{fmt(profile.ownersPayMonthlyKobo)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function kycBadge(status: string) {
  if (status === 'APPROVED') return <Badge className="bg-emerald-700 text-emerald-100 hover:bg-emerald-700">Approved</Badge>
  if (status === 'REJECTED') return <Badge className="bg-red-800 text-red-100 hover:bg-red-800">Rejected</Badge>
  return <Badge className="bg-amber-700 text-amber-100 hover:bg-amber-700">Pending</Badge>
}

function lockBadge(state: string) {
  if (state === 'LOCKED') return <Badge className="bg-gray-700 text-gray-300 hover:bg-gray-700">Locked</Badge>
  if (state === 'RELEASED' || state === 'PAID_OUT') return <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50">{state}</Badge>
  return <Badge className="bg-amber-700/30 text-amber-400 hover:bg-amber-700/30 border border-amber-700/50">{state}</Badge>
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [biz, setBiz] = useState<BusinessDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    adminApi.getBusiness(id)
      .then(setBiz)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white mb-6 -ml-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
      </div>
    )
  }

  if (!biz) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48 bg-gray-700" />
        <Skeleton className="h-32 w-full bg-gray-800" />
        <Skeleton className="h-48 w-full bg-gray-800" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/businesses')}
        className="text-gray-400 hover:text-white mb-6 -ml-2"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Businesses
      </Button>

      {/* Business header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {biz.businessName || <span className="italic text-gray-400">Unnamed Business</span>}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {biz.ownerEmail ?? <span className="italic">no email</span>}
              {biz.ownerPhone ? <> &middot; {biz.ownerPhone}</> : null}
              {' '}&middot; {biz.businessType}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {kycBadge(biz.kycStatus)}
            {biz.onboardingComplete
              ? <Badge className="bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/30 border border-emerald-700/50">Onboarded</Badge>
              : <Badge className="bg-gray-700 text-gray-400 hover:bg-gray-700">Not onboarded</Badge>
            }
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-500 mb-1">NUBAN</p>
            <p className="text-gray-200 font-mono text-sm">{biz.nuban ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Bank</p>
            <p className="text-gray-200 text-sm">{biz.nubanBankName ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">State</p>
            <p className="text-gray-200 text-sm">{biz.businessState ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Business ID</p>
            <p className="text-gray-400 font-mono text-xs truncate">{biz.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Joined</p>
            <p className="text-gray-200 text-sm">{fmtDate(biz.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Billing / Subscription */}
      <SubscriptionSection sub={biz.subscription} />

      {/* Sales Profile */}
      <SalesProfileSection profile={biz.salesProfile} />

      {/* Wallets */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Wallets ({biz.purses.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Label</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400 text-right">Balance</TableHead>
                <TableHead className="text-gray-400 text-right">Allocation</TableHead>
                <TableHead className="text-gray-400">Lock State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {biz.purses.length === 0 ? (
                <TableRow className="border-gray-700">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">No wallets</TableCell>
                </TableRow>
              ) : (
                biz.purses.map((p) => (
                  <TableRow key={p.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
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
      </div>

      {/* Recent Inflows */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Recent Inflows (last 10)</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-gray-400">Channel</TableHead>
                <TableHead className="text-gray-400">Payer</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {biz.recentInflows.length === 0 ? (
                <TableRow className="border-gray-700">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">No inflows</TableCell>
                </TableRow>
              ) : (
                biz.recentInflows.map((i) => (
                  <TableRow key={i.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-gray-400 text-sm">{fmtDateTime(i.createdAt)}</TableCell>
                    <TableCell className="text-right text-gray-200 font-medium text-sm">
                      {formatNaira(koboToNaira(i.amountKobo))}
                    </TableCell>
                    <TableCell className="text-gray-300 text-sm">{i.channel}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{i.payer ?? <span className="text-gray-600">—</span>}</TableCell>
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
      </div>
    </div>
  )
}
