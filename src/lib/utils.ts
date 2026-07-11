import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function koboToNaira(kobo: string | number): number {
  return Number(kobo) / 100
}

export function formatNaira(naira: number, compact = false): string {
  if (compact && naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(2)}M`
  if (compact && naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
