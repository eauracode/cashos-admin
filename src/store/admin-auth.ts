'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminAuthState {
  token: string | null
  issuedAt: number | null            // Unix ms when the current token was received
  setToken: (t: string) => void
  clear: () => void
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      issuedAt: null,
      setToken: (token) => set({ token, issuedAt: Date.now() }),
      clear: () => set({ token: null, issuedAt: null }),
    }),
    { name: 'cashos_admin_auth' }
  )
)
