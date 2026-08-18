'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Send, Users, CheckCircle, XCircle, Loader2, Trash2, ShieldCheck, ShieldOff, ChevronDown, ChevronUp } from 'lucide-react'
import { adminApi } from '@/lib/api'

interface PushResult  { sent: number; failed: number }
interface EmailResult { sent: number; failed: number; total: number }
interface PushConfig  { enabled: boolean; publicKey: string; publicKeyLen: number; publicKeyStart: string; publicKeyEnd: string }

export default function NotificationsPage() {
  // ── Push state ──────────────────────────────────────────────────────────────
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [loadingPushStats, setLoadingPushStats] = useState(true)
  const [pushConfig, setPushConfig] = useState<PushConfig | null>(null)
  const [clearingPush, setClearingPush] = useState(false)
  const [clearResult, setClearResult] = useState<string | null>(null)

  const [pushTitle, setPushTitle]   = useState('')
  const [pushBody, setPushBody]     = useState('')
  const [pushUrl, setPushUrl]       = useState('/dashboard')
  const [sendingPush, setSendingPush]     = useState(false)
  const [pushResult, setPushResult]       = useState<PushResult | null>(null)
  const [pushError, setPushError]         = useState<string | null>(null)

  // ── Email state ─────────────────────────────────────────────────────────────
  const [emailCount, setEmailCount]       = useState<{ total: number; withEmail: number } | null>(null)
  const [loadingEmailStats, setLoadingEmailStats] = useState(true)

  const [recipientMode, setRecipientMode] = useState<'all' | 'custom'>('all')
  const [customEmails, setCustomEmails]   = useState<string[]>([])
  const [emailInput, setEmailInput]       = useState('')
  const [emailInputError, setEmailInputError] = useState<string | null>(null)

  const [emailSubject, setEmailSubject]   = useState('')
  const [emailBody, setEmailBody]         = useState('')
  const [emailCtaText, setEmailCtaText]   = useState('')
  const [emailCtaUrl, setEmailCtaUrl]     = useState('')
  const [sendingEmail, setSendingEmail]   = useState(false)
  const [emailResult, setEmailResult]     = useState<EmailResult | null>(null)
  const [checkingTargets, setCheckingTargets] = useState(false)
  const [emailTargets, setEmailTargets]   = useState<{ total: number; targets: { email: string | null; businessName: string | null; onboardingDone: boolean }[] } | null>(null)
  const [emailError, setEmailError]       = useState<string | null>(null)

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

  const addEmail = () => {
    const val = emailInput.trim().toLowerCase()
    if (!val) return
    if (!isValidEmail(val)) { setEmailInputError('Enter a valid email address'); return }
    if (customEmails.includes(val)) { setEmailInputError('Already in the list'); return }
    setCustomEmails(prev => [...prev, val])
    setEmailInput('')
    setEmailInputError(null)
  }

  const removeEmail = (email: string) => setCustomEmails(prev => prev.filter(e => e !== email))

  useEffect(() => {
    adminApi.push.stats()
      .then((s) => setSubscriberCount(s.subscriberCount))
      .catch(() => setSubscriberCount(0))
      .finally(() => setLoadingPushStats(false))

    adminApi.push.config()
      .then(setPushConfig)
      .catch(() => null)

    adminApi.emails.count()
      .then(setEmailCount)
      .catch(() => setEmailCount({ total: 0, withEmail: 0 }))
      .finally(() => setLoadingEmailStats(false))
  }, [])

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pushTitle.trim() || !pushBody.trim()) return
    setSendingPush(true); setPushResult(null); setPushError(null)
    try {
      const res = await adminApi.push.broadcast({ title: pushTitle.trim(), body: pushBody.trim(), url: pushUrl.trim() || '/dashboard' })
      setPushResult(res)
    } catch (err: any) {
      setPushError(err?.message ?? 'Broadcast failed')
    } finally {
      setSendingPush(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailSubject.trim() || !emailBody.trim()) return
    if (recipientMode === 'custom' && customEmails.length === 0) {
      setEmailError('Add at least one recipient email address'); return
    }
    setSendingEmail(true); setEmailResult(null); setEmailError(null)
    try {
      const res = await adminApi.emails.broadcast({
        subject:    emailSubject.trim(),
        body:       emailBody.trim(),
        ...(emailCtaText.trim() && emailCtaUrl.trim()
          ? { ctaText: emailCtaText.trim(), ctaUrl: emailCtaUrl.trim() }
          : {}),
        ...(recipientMode === 'custom' ? { recipients: customEmails } : {}),
      })
      setEmailResult(res)
    } catch (err: any) {
      setEmailError(err?.message ?? 'Email broadcast failed')
    } finally {
      setSendingEmail(false)
    }
  }

  const inputCls = 'w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5'

  return (
    <div className="p-6 space-y-8 max-w-5xl">

      {/* ── PUSH NOTIFICATIONS ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Push Notifications</h1>
            <p className="text-gray-400 text-sm">Broadcast to users who enabled notifications in their browser</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-5">
          {/* Subscriber count */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4 flex-1 min-w-[180px]">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Subscribed devices</p>
              {loadingPushStats
                ? <div className="h-7 w-12 rounded bg-gray-700 animate-pulse mt-1" />
                : <p className="text-2xl font-bold text-white mt-0.5">{subscriberCount ?? '—'}</p>}
            </div>
          </div>

          {/* VAPID config status */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4 flex-1 min-w-[220px]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${pushConfig?.enabled ? 'bg-emerald-600/20' : 'bg-red-600/20'}`}>
              {pushConfig?.enabled
                ? <ShieldCheck className="w-5 h-5 text-emerald-400" />
                : <ShieldOff className="w-5 h-5 text-red-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">VAPID config</p>
              {!pushConfig
                ? <div className="h-4 w-20 rounded bg-gray-700 animate-pulse mt-1" />
                : pushConfig.enabled
                  ? <p className="text-xs text-emerald-400 font-mono mt-1 truncate">
                      {pushConfig.publicKeyStart}…{pushConfig.publicKeyEnd} ({pushConfig.publicKeyLen} chars)
                    </p>
                  : <p className="text-xs text-red-400 mt-1">Keys not configured</p>}
            </div>
          </div>

          {/* Clear all subscriptions */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Reset DB subscriptions</p>
              <p className="text-gray-500 text-[11px] mb-3">Use after changing VAPID keys to remove stale records.</p>
              {clearResult && <p className="text-emerald-400 text-xs mb-2">{clearResult}</p>}
              <button
                onClick={async () => {
                  setClearingPush(true); setClearResult(null)
                  try {
                    const r = await adminApi.push.clearSubs()
                    setClearResult(`Deleted ${r.deleted} subscription(s). Re-subscribe from the app now.`)
                    setSubscriberCount(0)
                  } catch { setClearResult('Failed to clear.') }
                  finally { setClearingPush(false) }
                }}
                disabled={clearingPush}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {clearingPush ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Clear all subscriptions
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Push form */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Send broadcast</h2>
            <form onSubmit={handleSendPush} className="space-y-4">
              <div>
                <label className={labelCls}>Title</label>
                <input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="e.g. CashOS update 🚀" className={inputCls} maxLength={80} required />
                <p className="text-[11px] text-gray-500 mt-1 text-right">{pushTitle.length}/80</p>
              </div>
              <div>
                <label className={labelCls}>Body</label>
                <textarea value={pushBody} onChange={(e) => setPushBody(e.target.value)}
                  placeholder="e.g. A new feature just dropped. Tap to check it out."
                  rows={3} className={`${inputCls} resize-none`} maxLength={200} required />
                <p className="text-[11px] text-gray-500 mt-1 text-right">{pushBody.length}/200</p>
              </div>
              <div>
                <label className={labelCls}>Deep-link URL</label>
                <input value={pushUrl} onChange={(e) => setPushUrl(e.target.value)}
                  placeholder="/dashboard" className={inputCls} />
              </div>
              {pushError && (
                <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-xs">{pushError}</p>
                </div>
              )}
              {pushResult && (
                <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-300 text-xs">
                    Sent to {pushResult.sent} device{pushResult.sent !== 1 ? 's' : ''}.
                    {pushResult.failed > 0 && ` ${pushResult.failed} failed (stale subscriptions removed).`}
                  </p>
                </div>
              )}
              <button type="submit" disabled={sendingPush || !pushTitle.trim() || !pushBody.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                {sendingPush
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Send className="w-4 h-4" /> Send to subscribed devices</>}
              </button>
            </form>
          </div>

          {/* Automated triggers reference */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Automated triggers</h2>
            <div className="space-y-3">
              {[
                { event: 'Payment received',       trigger: 'Inflow worker → after allocation fires',                      tag: 'inflow' },
                { event: 'Wallet target reached',  trigger: 'Inflow worker → when balance crosses targetKobo',             tag: 'target-{purseId}' },
                { event: 'Low balance warning',    trigger: 'Inflow worker → balance < 20% of target after allocation',    tag: 'low-{purseId}' },
                { event: 'Wallet unlocked',        trigger: 'Release scheduler → 06:00 Lagos daily',                       tag: 'release-{purseId}' },
                { event: 'Emergency unlock ready', trigger: 'Emergency scheduler → every 30 min',                          tag: 'unlock-ready-{id}' },
                { event: 'Pending inflows',        trigger: 'PushScheduler → every hour (inflows unallocated > 1hr)',      tag: 'pending-inflows' },
                { event: 'Inactivity reminder',    trigger: 'PushScheduler → 09:00 Lagos daily',                           tag: 'inactivity' },
                { event: 'New-user welcome',       trigger: 'PushScheduler → every 2hr (onboarded 12–24hr ago, no flows)', tag: 'new-user-reminder' },
              ].map(({ event, trigger, tag }) => (
                <div key={event} className="border-b border-gray-700/60 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-200">{event}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{trigger}</p>
                  <code className="text-[10px] text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded mt-1 inline-block">{tag}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EMAIL BROADCAST ──────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Email Broadcast</h1>
            <p className="text-gray-400 text-sm">Sends to every registered user — no opt-in needed</p>
          </div>
        </div>

        {/* Stat */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Total users</p>
              {loadingEmailStats
                ? <div className="h-7 w-10 rounded bg-gray-700 animate-pulse mt-1" />
                : <p className="text-2xl font-bold text-white mt-0.5">{emailCount?.total ?? '—'}</p>}
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Have email</p>
              {loadingEmailStats
                ? <div className="h-7 w-10 rounded bg-gray-700 animate-pulse mt-1" />
                : <p className="text-2xl font-bold text-emerald-400 mt-0.5">{emailCount?.withEmail ?? '—'}</p>}
            </div>
          </div>
        </div>

        {/* ── Diagnostic: check exact broadcast targets ─────────────────── */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-5 max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Broadcast target list</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Shows the exact emails the broadcast query returns from the live DB — use to verify delivery count.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (emailTargets) { setEmailTargets(null); return }
                setCheckingTargets(true)
                try {
                  const res = await adminApi.emails.targets()
                  setEmailTargets(res)
                } catch (err: any) {
                  setEmailError(err?.message ?? 'Failed to fetch targets')
                } finally {
                  setCheckingTargets(false)
                }
              }}
              disabled={checkingTargets}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
            >
              {checkingTargets
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…</>
                : emailTargets
                  ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</>
                  : <><ChevronDown className="w-3.5 h-3.5" /> Check targets</>}
            </button>
          </div>

          {emailTargets && (
            <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${emailTargets.total === (emailCount?.withEmail ?? emailTargets.total) ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {emailTargets.total}
                </span>
                <div>
                  <p className="text-sm text-white font-medium">
                    {emailTargets.total === (emailCount?.withEmail ?? emailTargets.total)
                      ? 'Matches "Have email" count ✓'
                      : `Mismatch — count shows ${emailCount?.withEmail ?? '?'} but query returns ${emailTargets.total}`}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {emailTargets.targets.filter(t => t.businessName).length} have business name ·&nbsp;
                    {emailTargets.targets.filter(t => !t.businessName).length} name-less (will greet by email prefix) ·&nbsp;
                    {emailTargets.targets.filter(t => t.onboardingDone).length} onboarded
                  </p>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-700/60">
                {emailTargets.targets.map((t, i) => (
                  <div key={t.email ?? i} className="flex items-center gap-3 px-3 py-2 text-xs">
                    <span className="text-gray-500 w-5 text-right flex-shrink-0">{i + 1}</span>
                    <span className="text-gray-200 flex-1 truncate font-mono">{t.email ?? '—'}</span>
                    <span className={`flex-shrink-0 ${t.businessName ? 'text-gray-400' : 'text-gray-600 italic'}`}>
                      {t.businessName ?? 'no name'}
                    </span>
                    <span className={`flex-shrink-0 w-16 text-right ${t.onboardingDone ? 'text-emerald-500' : 'text-gray-600'}`}>
                      {t.onboardingDone ? 'onboarded' : 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-xl">
          <h2 className="text-sm font-semibold text-white mb-4">Compose email</h2>
          <form onSubmit={handleSendEmail} className="space-y-4">

            {/* ── Recipient mode ─────────────────────────────── */}
            <div>
              <label className={labelCls}>Send to</label>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setRecipientMode('all')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                    recipientMode === 'all'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}>
                  All users
                  {emailCount && <span className="ml-1.5 opacity-70 font-normal">({emailCount.withEmail})</span>}
                </button>
                <button type="button"
                  onClick={() => setRecipientMode('custom')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                    recipientMode === 'custom'
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}>
                  Custom list
                </button>
              </div>
            </div>

            {/* ── Custom email list ───────────────────────────── */}
            {recipientMode === 'custom' && (
              <div className="border border-dashed border-gray-600 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Recipient emails
                  <span className="font-normal text-gray-600 normal-case tracking-normal ml-1">
                    — for non-users or marketing lists
                  </span>
                </p>
                <div className="flex gap-2">
                  <input
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setEmailInputError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail() } }}
                    placeholder="name@example.com"
                    className={`${inputCls} flex-1`}
                    type="email"
                  />
                  <button type="button" onClick={addEmail}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
                    + Add
                  </button>
                </div>
                {emailInputError && (
                  <p className="text-[11px] text-red-400">{emailInputError}</p>
                )}
                {customEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customEmails.map((email) => (
                      <span key={email}
                        className="flex items-center gap-1.5 bg-gray-700 border border-gray-600 rounded-full px-3 py-1 text-xs text-gray-200">
                        {email}
                        <button type="button" onClick={() => removeEmail(email)}
                          className="text-gray-500 hover:text-red-400 transition-colors leading-none">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {customEmails.length === 0 && (
                  <p className="text-[11px] text-gray-600">No recipients added yet. Type an email and press Enter or + Add.</p>
                )}
                {customEmails.length > 0 && (
                  <p className="text-[11px] text-gray-500">{customEmails.length} recipient{customEmails.length !== 1 ? 's' : ''} added</p>
                )}
              </div>
            )}

            <div>
              <label className={labelCls}>Subject</label>
              <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. CashOS just got better — here's what's new"
                className={inputCls} maxLength={150} required />
            </div>
            <div>
              <label className={labelCls}>Body <span className="text-gray-600">(plain text — line breaks are preserved)</span></label>
              <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                placeholder={'Hi {{FIRST_NAME}},\n\nWe just shipped something you\'ll love...\n\nThe CashOS team'}
                rows={8} className={`${inputCls} resize-y`} required />
              <p className="text-[11px] text-gray-500 mt-1">
                Use <code className="text-gray-300">{'{{FIRST_NAME}}'}</code> for the business name.
                Sent from <span className="text-gray-300">noreply@getcashos.com</span>.
              </p>
            </div>

            {/* CTA button (optional) */}
            <div className="border border-dashed border-gray-600 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">CTA Button <span className="font-normal text-gray-600 normal-case tracking-normal">(optional)</span></p>
              <div>
                <label className={labelCls}>Button label</label>
                <input value={emailCtaText} onChange={(e) => setEmailCtaText(e.target.value)}
                  placeholder="e.g. Open App" className={inputCls} maxLength={60} />
              </div>
              <div>
                <label className={labelCls}>Button URL</label>
                <input value={emailCtaUrl} onChange={(e) => setEmailCtaUrl(e.target.value)}
                  placeholder="e.g. https://app.getcashos.com/dashboard" className={inputCls} type="url" />
              </div>
              {(emailCtaText.trim() || emailCtaUrl.trim()) && (!emailCtaText.trim() || !emailCtaUrl.trim()) && (
                <p className="text-[11px] text-amber-400">Both label and URL are required to render the button.</p>
              )}
            </div>
            {emailError && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-xs">{emailError}</p>
              </div>
            )}
            {emailResult && (
              <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-emerald-300 text-xs">
                  Sent {emailResult.sent} of {emailResult.total} emails.
                  {emailResult.failed > 0 && ` ${emailResult.failed} failed.`}
                </p>
              </div>
            )}
            <button type="submit"
              disabled={
                sendingEmail || !emailSubject.trim() || !emailBody.trim() ||
                (recipientMode === 'custom' && customEmails.length === 0)
              }
              className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
              {sendingEmail
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : recipientMode === 'custom'
                  ? <><Mail className="w-4 h-4" /> Send to {customEmails.length} recipient{customEmails.length !== 1 ? 's' : ''}</>
                  : <><Mail className="w-4 h-4" /> Send to all {emailCount?.withEmail ?? ''} users</>}
            </button>
          </form>
        </div>
      </section>

    </div>
  )
}
