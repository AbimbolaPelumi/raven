/**
 * Home dashboard data. Everything here is a pure function of the simulated
 * clock (`now`), so server and client render identically and the numbers on
 * Home always agree with the Payouts page:
 *
 *  - Days the Payouts page knows about use the same sales figures
 *    (`salesFor`), including today's sales so far.
 *  - Earlier days are deterministic, plausible filler (weekly shape + jitter).
 */
import { addMinutes, dayOf, fmtTime, salesFor } from "@/lib/proto"

export type Period = 7 | 30 | 90
export const PERIODS: Period[] = [7, 30, 90]

/* ------------------------------ date helpers ------------------------------ */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function toUTC(day: string) {
  const [y, m, d] = day.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

export function addDays(day: string, n: number) {
  const d = new Date(toUTC(day) + n * 86_400_000)
  const p = (x: number) => String(x).padStart(2, "0")
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

/** `27 Nov` */
export function shortDate(day: string) {
  const [, m, d] = day.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

/* ------------------------------ daily volume ------------------------------ */

// Deterministic 0..1 noise from a string (no Math.random: SSR/CSR must match).
function noise(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10_000) / 10_000
}

// Sun..Sat. Shaped like real sales days (Fri highest, Sun lowest).
const WEEKDAY = [0.65, 1.04, 0.96, 1.08, 1.0, 1.3, 1.08]

function fillerVolume(day: string) {
  const weekday = new Date(toUTC(day)).getUTCDay()
  return Math.round((340_000 * WEEKDAY[weekday] * (0.88 + noise(`v${day}`) * 0.24)) / 25) * 25
}

/** The chart runs up to today (today's bar is sales so far). */
export function lastDataDay(now: string) {
  return dayOf(now)
}

/** Sales for a day. Known days come from `salesFor`, the same source as Payouts. */
export function dailyVolume(day: string, now: string) {
  const v = salesFor(day, now)
  if (v === null) return null
  return v ?? fillerVolume(day)
}

/* --------------------------------- metrics --------------------------------- */

export interface DayMetrics {
  day: string
  volume: number
  payments: number
  aov: number
  newCustomers: number
}

function dayMetrics(day: string, volume: number): DayMetrics {
  const aov = Math.round(18_500 + (noise(`a${day}`) - 0.5) * 4_000)
  const payments = Math.max(1, Math.round(volume / aov))
  const newCustomers = Math.round(payments * (0.18 + noise(`n${day}`) * 0.1))
  return { day, volume, payments, aov, newCustomers }
}

/** `count` consecutive days ending at `end` (inclusive), oldest first. */
function window(end: string, count: number, now: string): DayMetrics[] {
  const out: DayMetrics[] = []
  for (let i = count - 1; i >= 0; i--) {
    const day = addDays(end, -i)
    const v = dailyVolume(day, now)
    if (v !== null) out.push(dayMetrics(day, v))
  }
  return out
}

export interface Totals {
  volume: number
  payments: number
  aov: number
  newCustomers: number
  refundedCount: number
  refundedAmount: number
  failedCount: number
  failedAmount: number
}

function totals(days: DayMetrics[]): Totals {
  const volume = days.reduce((s, d) => s + d.volume, 0)
  const payments = days.reduce((s, d) => s + d.payments, 0)
  const newCustomers = days.reduce((s, d) => s + d.newCustomers, 0)
  const aov = payments ? Math.round(volume / payments) : 0
  // Small, steady rates so the breakdown is plausible for any business.
  const refundedCount = Math.round(payments * 0.017)
  const failedCount = Math.round(payments * 0.034)
  return {
    volume,
    payments,
    aov,
    newCustomers,
    refundedCount,
    refundedAmount: refundedCount * aov,
    failedCount,
    failedAmount: failedCount * aov,
  }
}

export interface PeriodStats {
  period: Period
  /** First and last day of the current and previous windows. */
  range: { from: string; to: string; prevFrom: string; prevTo: string }
  current: DayMetrics[]
  previous: DayMetrics[]
  now: Totals
  before: Totals
}

export function periodStats(period: Period, now: string): PeriodStats {
  const end = lastDataDay(now)
  const current = window(end, period, now)
  const prevEnd = addDays(end, -period)
  const previous = window(prevEnd, period, now)
  return {
    period,
    range: {
      from: addDays(end, -(period - 1)),
      to: end,
      prevFrom: addDays(prevEnd, -(period - 1)),
      prevTo: prevEnd,
    },
    current,
    previous,
    now: totals(current),
    before: totals(previous),
  }
}

/** Relative change as a fraction; null when there is no previous value. */
export function change(cur: number, prev: number) {
  return prev > 0 ? (cur - prev) / prev : null
}

export function fmtChange(c: number | null) {
  if (c === null) return "-"
  const pct = c * 100
  const abs = Math.abs(pct)
  const digits = abs >= 100 ? 0 : 1
  return `${pct >= 0 ? "+" : "-"}${abs.toFixed(digits)}%`
}

/* --------------------------------- fixtures -------------------------------- */

export type PaymentStatus = "succeeded" | "refunded" | "failed"

export interface RecentPayment {
  id: string
  name: string
  email: string
  amount: number
  status: PaymentStatus
  minutesAgo: number
}

export const RECENT_PAYMENTS: RecentPayment[] = [
  { id: "p1", name: "Amaka Obi", email: "amaka.obi@example.com", amount: 24_500, status: "succeeded", minutesAgo: 6 },
  { id: "p2", name: "Chidi Eze", email: "chidi.eze@example.com", amount: 18_000, status: "succeeded", minutesAgo: 19 },
  { id: "p3", name: "Zainab Bello", email: "zainab.bello@example.com", amount: 62_300, status: "failed", minutesAgo: 41 },
  { id: "p4", name: "Tunde Bakare", email: "tunde.bakare@example.com", amount: 15_750, status: "succeeded", minutesAgo: 73 },
  { id: "p5", name: "Ngozi Okafor", email: "ngozi.okafor@example.com", amount: 9_200, status: "refunded", minutesAgo: 118 },
  { id: "p6", name: "Ibrahim Musa", email: "ibrahim.musa@example.com", amount: 33_400, status: "succeeded", minutesAgo: 164 },
]

export function paymentTime(p: RecentPayment, now: string) {
  const at = addMinutes(now, -p.minutesAgo)
  return `${shortDate(at.slice(0, 10))}, ${fmtTime(at)}`
}

export const TOP_CUSTOMERS = [
  { name: "Amaka Obi", email: "amaka.obi@example.com", amount: 486_200 },
  { name: "Ibrahim Musa", email: "ibrahim.musa@example.com", amount: 351_750 },
  { name: "Ngozi Okafor", email: "ngozi.okafor@example.com", amount: 298_400 },
  { name: "Tunde Bakare", email: "tunde.bakare@example.com", amount: 224_900 },
]

/* --------------------------------- format ---------------------------------- */

/** `₦1.2M`, `₦350K`, `₦980` for chart axes. */
export function fmtCompactNaira(n: number) {
  const trim = (x: number) => x.toFixed(1).replace(/\.0$/, "")
  if (n >= 1_000_000_000) return `₦${trim(n / 1_000_000_000)}B`
  if (n >= 1_000_000) return `₦${trim(n / 1_000_000)}M`
  if (n >= 1_000) return `₦${trim(n / 1_000)}K`
  return `₦${Math.round(n)}`
}
