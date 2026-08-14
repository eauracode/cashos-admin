'use client'

import { useState, useEffect } from 'react'
import { Bell, Send, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { adminApi } from '@/lib/api'

interface BroadcastResult {
  sent: number
  failed: number
}

export default function NotificationsPage() {
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [url, setUrl]       = useState('/dashboard')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<BroadcastResult | null>(null)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    adminApi.push.stats()
      .then((s) => setSubscriberCount(s.subscriberCount))
      .catch(() => setSubscriberCount(0))
      .finally(() => setLoadingStats(false))
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    setSending(true)
    setResult(null)
    setError(null)

    try {
      const res = await adminApi.push.broadcast({ title: title.trim(), body: body.trim(), url: url.trim() || '/dashboard' })
      setResult(res)
    } catch (err: any) {
      setError(err?.message ?? 'Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  const TRIGGER_DOCS = [
    { event: 'Payment received',         trigger: 'Inflow worker → after allocation fires',                      tag: 'inflow' },
    { event: 'Wallet target reached',    trigger: 'Inflow worker → when balance crosses targetKobo',             tag: 'target-{purseId}' },
    { event: 'Low balance warning',      trigger: 'Inflow worker → balance < 20% of target after allocation',    tag: 'low-{purseId}' },
    { event: 'Wallet unlocked',          trigger: 'Release scheduler → 06:00 Lagos daily',                       tag: 'release-{purseId}' },
    { event: 'Emergency unlock ready',   trigger: 'Emergency scheduler → every 30 min',                         tag: 'unlock-ready-{id}' },
    { event: 'Pending inflows',          trigger: 'PushScheduler → every hour (inflows unallocated > 1hr)',      tag: 'pending-inflows' },
    { event: 'Inactivity reminder',      trigger: 'PushScheduler → 09:00 Lagos daily',                          tag: 'inactivity' },
    { event: 'New-user welcome',         trigger: 'PushScheduler → every 2hr (onboarded 12–24hr ago, no flows)', tag: 'new-user-reminder' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Push Notifications</h1>
          <p className="text-gray-400 text-sm">Broadcast to all subscribed users</p>
        </div>
      </div>

      {/* Stat card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Subscribed devices</p>
          {loadingStats
            ? <div className="h-7 w-12 rounded bg-gray-700 animate-pulse mt-1" />
            : <p className="text-2xl font-bold text-white mt-0.5">{subscriberCount ?? '—'}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast form */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Send broadcast</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CashOS is now live 🚀"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={80}
                required
              />
              <p className="text-[11px] text-gray-500 mt-1 text-right">{title.length}/80</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. A new feature just dropped. Tap to check it out."
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={200}
                required
              />
              <p className="text-[11px] text-gray-500 mt-1 text-right">{body.length}/200</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Deep-link URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/dashboard"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            {result && (
              <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-300 text-xs">
                  Sent to {result.sent} device{result.sent !== 1 ? 's' : ''}.
                  {result.failed > 0 && ` ${result.failed} failed (stale subscriptions removed).`}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !body.trim()}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Send to all subscribers</>
              )}
            </button>
          </form>
        </div>

        {/* Automated trigger reference */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Automated triggers</h2>
          <div className="space-y-3">
            {TRIGGER_DOCS.map(({ event, trigger, tag }) => (
              <div key={event} className="border-b border-gray-700/60 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-gray-200">{event}</p>
                <p className="text-xs text-gray-500 mt-0.5">{trigger}</p>
                <code className="text-[10px] text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded mt-1 inline-block">{tag}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
