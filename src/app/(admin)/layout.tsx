'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/store/admin-auth'
import AdminShell from '@/components/AdminShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const token = useAdminAuth((s) => s.token)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/login')
    }
  }, [hydrated, token, router])

  if (!hydrated || !token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return <AdminShell>{children}</AdminShell>
}
