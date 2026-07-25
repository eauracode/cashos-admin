import { useAdminAuth } from '@/store/admin-auth'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://cashos-api.onrender.com/api/v1'

// The admin token lives 48h. Once it's past the halfway mark, transparently
// exchange it for a fresh one so an active operator is never logged out
// mid-session. Refresh requires a still-valid token (guarded server-side),
// so this must happen proactively — a dead token can't refresh itself.
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return useAdminAuth.getState().token
}

let refreshInFlight: Promise<void> | null = null

async function maybeRefresh(): Promise<void> {
  if (typeof window === 'undefined') return
  const { token, issuedAt } = useAdminAuth.getState()
  if (!token) return
  // Fresh enough — nothing to do. (Missing issuedAt = legacy session → refresh once.)
  if (issuedAt && Date.now() - issuedAt < REFRESH_AFTER_MS) return
  // Collapse concurrent refreshes into one network call.
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE}/admin/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': '1',
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const { token: fresh } = await res.json()
        if (fresh) useAdminAuth.getState().setToken(fresh)
      }
      // On failure keep the current token — the normal 401 path below handles a
      // genuinely expired session.
    } catch {
      // Network hiccup — leave the token as-is and retry on the next request.
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  await maybeRefresh()
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': '1',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cashos_admin_auth')
      window.location.replace('/login')
    }
    throw new Error('Session expired — please log in again')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `${method} ${path} failed (${res.status})`)
  }
  return res.json()
}

export const adminApi = {
  login: (username: string, password: string) =>
    req<{ token: string }>('POST', '/admin/auth/login', { username, password }),
  stats: () => req<AdminStats>('GET', '/admin/stats'),
  businesses: (page = 1, search?: string, kycStatus?: string, onboarded?: string, subscriptionStatus?: string) => {
    const params = new URLSearchParams({ page: String(page) })
    if (search)             params.set('search', search)
    if (kycStatus)          params.set('kycStatus', kycStatus)
    if (onboarded)          params.set('onboarded', onboarded)
    if (subscriptionStatus) params.set('subscriptionStatus', subscriptionStatus)
    return req<BusinessList>('GET', `/admin/businesses?${params}`)
  },
  getBusiness: (id: string) => req<BusinessDetail>('GET', `/admin/businesses/${id}`),
  inflows: (page = 1, search?: string, channel?: string, status?: string) => {
    const params = new URLSearchParams({ page: String(page) })
    if (search)  params.set('search', search)
    if (channel) params.set('channel', channel)
    if (status)  params.set('status', status)
    return req<InflowList>('GET', `/admin/inflows?${params}`)
  },
  wallets: (page = 1, search?: string, purseType?: string) => {
    const params = new URLSearchParams({ page: String(page) })
    if (search)    params.set('search', search)
    if (purseType) params.set('purseType', purseType)
    return req<WalletList>('GET', `/admin/wallets?${params}`)
  },
  emergencyUnlocks: (page = 1, pendingOnly = false) =>
    req<EmergencyUnlockList>('GET', `/admin/emergency-unlocks?page=${page}&pending=${pendingOnly}`),
  spends: (page = 1, search?: string) => {
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    return req<SpendList>('GET', `/admin/spends?${params}`)
  },
  push: {
    stats:     () => req<{ subscriberCount: number }>('GET', '/admin/push/stats'),
    broadcast: (body: { title: string; body: string; url?: string }) =>
      req<{ sent: number; failed: number }>('POST', '/admin/push/broadcast', body),
  },
}

// Types
export interface AdminStats {
  totalBusinesses: number
  onboardedBusinesses: number
  totalInflowKobo: string
  totalInflows: number
  recentInflowKobo: string
  totalPurseBalanceKobo: string
  fundsUnderManagementKobo: string
  billingTrialing: number
  billingActive: number
  billingLapsed: number
  dailyInflows: { date: string; amountKobo: string }[]
}

export interface BusinessRow {
  id: string
  businessName: string
  ownerEmail: string | null
  ownerPhone: string | null
  businessState: string | null
  businessType: string
  kycStatus: string
  onboardingComplete: boolean
  nuban: string | null
  nubanBankName: string | null
  inflowCount: number
  totalBalanceKobo: string
  subscriptionPlan: string | null
  subscriptionStatus: string | null
  createdAt: string
}

export interface BusinessList {
  data: BusinessRow[]
  total: number
  page: number
  pages: number
}

export interface PurseRow {
  id: string
  label: string
  purseType: string
  color: string
  balanceKobo: string
  allocationBps: number
  lockState: string
}

export interface BusinessSubscription {
  plan: string
  status: string
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelledAt: string | null
}

export interface BusinessSalesProfile {
  avgMonthlySalesUnits: number | null
  avgSaleMinKobo: string | null
  avgSaleMaxKobo: string | null
  avgSaleAvgKobo: string | null
  cogsPct: number | null
  rentMonthlyKobo: string | null
  salariesMonthlyKobo: string | null
  debtMonthlyKobo: string | null
  ownersPayMonthlyKobo: string | null
}

export interface BusinessDetail {
  id: string
  businessName: string
  ownerEmail: string | null
  ownerPhone: string | null
  businessState: string | null
  businessType: string
  kycStatus: string
  onboardingComplete: boolean
  nuban: string | null
  nubanBankName: string | null
  createdAt: string
  purses: PurseRow[]
  recentInflows: {
    id: string
    amountKobo: string
    channel: string
    payer: string | null
    allocated: boolean
    undone: boolean
    createdAt: string
  }[]
  subscription: BusinessSubscription | null
  salesProfile: BusinessSalesProfile | null
}

export interface InflowRow {
  id: string
  businessId: string
  businessName: string
  ownerPhone: string
  amountKobo: string
  channel: string
  payer: string | null
  reference: string | null
  allocated: boolean
  undone: boolean
  createdAt: string
}

export interface InflowList {
  data: InflowRow[]
  total: number
  page: number
  pages: number
}

export interface WalletRow {
  id: string
  businessId: string
  businessName: string
  label: string
  purseType: string
  color: string
  balanceKobo: string
  allocationBps: number
  lockState: string
}

export interface WalletList {
  data: WalletRow[]
  total: number
  page: number
  pages: number
}

export interface EmergencyUnlockRow {
  id: string
  businessId: string
  businessName: string
  ownerEmail: string | null
  purseLabel: string
  purseColor: string
  reason: string
  coolingOffEndsAt: string
  confirmedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface EmergencyUnlockList {
  data: EmergencyUnlockRow[]
  total: number
  page: number
  pages: number
}

export interface SpendRow {
  id: string
  businessId: string
  businessName: string
  purseLabel: string
  purseColor: string
  amountKobo: string
  description: string
  createdAt: string
}

export interface SpendList {
  data: SpendRow[]
  total: number
  page: number
  pages: number
}
