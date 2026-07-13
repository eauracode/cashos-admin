const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

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
    // Session expired — clear stored token and send back to login
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
  businesses: (page = 1) => req<BusinessList>('GET', `/admin/businesses?page=${page}`),
  getBusiness: (id: string) => req<BusinessDetail>('GET', `/admin/businesses/${id}`),
  inflows: (page = 1) => req<InflowList>('GET', `/admin/inflows?page=${page}`),
  wallets: (page = 1) => req<WalletList>('GET', `/admin/wallets?page=${page}`),
}

// Types
export interface AdminStats {
  totalBusinesses: number
  onboardedBusinesses: number
  totalInflowKobo: string
  totalInflows: number
  recentInflowKobo: string
  totalPurseBalanceKobo: string
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
