const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://cashos-api.onrender.com/api/v1'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('cashos_admin_auth')
    return stored ? JSON.parse(stored).state?.token : null
  } catch { return null }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
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
  businesses: (page = 1, search?: string) => {
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    return req<BusinessList>('GET', `/admin/businesses?${params}`)
  },
  getBusiness: (id: string) => req<BusinessDetail>('GET', `/admin/businesses/${id}`),
  inflows: (page = 1) => req<InflowList>('GET', `/admin/inflows?page=${page}`),
  wallets: (page = 1) => req<WalletList>('GET', `/admin/wallets?page=${page}`),
  emergencyUnlocks: (page = 1, pendingOnly = false) =>
    req<EmergencyUnlockList>('GET', `/admin/emergency-unlocks?page=${page}&pending=${pendingOnly}`),
  spends: (page = 1) => req<SpendList>('GET', `/admin/spends?page=${page}`),
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
