/**
 * Prototype domain: types, simulated-time helpers, fixtures, and the single
 * `derive` function that turns store state into everything the UI shows.
 * Banner, cards, table rows, drawer and the Home chart all read from here, so
 * every number agrees by construction.
 *
 * Money model (same words everywhere):
 *  - Payout balance: money from sales that hasn't been paid out yet.
 *  - Payout: a transfer to the bank. Each day's sales pay out automatically on
 *    the next working day.
 *  - On hold: a payout that would normally go out but is paused. Nothing leaves
 *    the balance; new sales keep joining it and pay out after the review.
 */

/**
 * none        before any hold
 * paused      under review, Raven is doing the work, no action needed
 * info-needed exception: Raven asked for more information (the only red state)
 * reviewing   she sent the requested details; under review again
 * resumed     hold cleared
 */
export type HoldState = "none" | "paused" | "info-needed" | "reviewing" | "resumed"
export type PayoutStatus = "paid" | "on-hold" | "scheduled"

export interface UploadFile {
  id: string
  name: string
  size: number
  status: "uploading" | "done" | "error"
  progress: number
  error?: string
  /** false for validation errors (too large / wrong type): only Remove is useful */
  retryable?: boolean
}

export interface PushNote {
  id: string
  title: string
  body: string
  href: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  at: string
  read: boolean
  href: string
}

export interface Email {
  id: string
  from: string
  subject: string
  preview: string
  at: string
  read: boolean
}

/** Reply to an information request. */
export interface Submission {
  reason: string
  files: UploadFile[]
  at: string
}

/** "Expected this activity?": optional context she volunteers. */
export interface ContextNote {
  choice: string
  note: string
  link: string
  files: UploadFile[]
  at: string
}

export const CONTEXT_CHOICES = [
  "A promotion or sale",
  "Seasonal demand",
  "A new product or launch",
  "Something else",
] as const

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const HOLD_REF = "HLD-261127-0412"
export const RECIPIENT = "GTBank •••• 4821"
export const HOLD_DAY = "2026-11-27"
export const HOLD_STARTED = "2026-11-27T15:12"
export const RESET_NOW = "2026-11-27T15:00"
/** "Next day" in the demo panel moves the clock here (hold still on). */
export const NEXT_DAY = "2026-11-28T09:30"
export const CLEARED_NOW = "2026-11-28T10:05"
/** The payout Friday's sales were due in (and the weekend's would join). */
export const NEXT_PAYOUT_DAY = "2026-11-30"
/** Raven promises an update by this date, not a release. */
export const UPDATE_BY = "2026-11-30"
export const HOLD_AMOUNT = 3_457_350
export const HOLD_HREF = "/payouts?hold=open"
export const MAX_FILE_BYTES = 10 * 1024 * 1024

/* ------------------------------------------------------------------ */
/* Simulated time. `now` is a naive "YYYY-MM-DDTHH:mm" string (Lagos).  */
/* ------------------------------------------------------------------ */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function parse(iso: string) {
  const [d, t = "00:00"] = iso.split("T")
  const [y, m, day] = d.split("-").map(Number)
  const [hh, mm] = t.split(":").map(Number)
  return { y, m, day, hh, mm }
}

/** `Fri, 27 Nov 2026` */
export function fmtDate(iso: string) {
  return `${fmtDayShort(iso)} ${parse(iso).y}`
}

/** `Fri, 27 Nov` */
export function fmtDayShort(iso: string) {
  const { y, m, day } = parse(iso)
  const wd = DAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()]
  return `${wd}, ${day} ${MONTHS[m - 1]}`
}

/** `3:12pm` */
export function fmtTime(iso: string) {
  const { hh, mm } = parse(iso)
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${String(mm).padStart(2, "0")}${hh >= 12 ? "pm" : "am"}`
}

/** `Fri, 27 Nov 2026, 3:12pm` */
export function fmtDateTime(iso: string) {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`
}

export function dayOf(iso: string) {
  return iso.slice(0, 10)
}

export function addMinutes(iso: string, minutes: number) {
  const { y, m, day, hh, mm } = parse(iso)
  const d = new Date(Date.UTC(y, m - 1, day, hh, mm + minutes))
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

export function fmtNaira(n: number) {
  return `₦${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/* ------------------------------------------------------------------ */
/* Alerts (push, SMS, email). Short, no amount, nothing sensitive.      */
/* ------------------------------------------------------------------ */

export const ALERT = {
  pushTitle: "Payouts paused for review",
  pushBody: `No action needed. We'll update you by ${fmtDayShort(UPDATE_BY)}.`,
  sms: `Raven: Your payouts are paused for review. No action needed. We'll update you by ${fmtDayShort(UPDATE_BY)}. Details: raven.ng/h/${HOLD_REF}`,
  emailSubject: "Your payouts are paused for review",
  emailPreview: `No action needed. We'll update you by ${fmtDayShort(UPDATE_BY)}.`,
}

/* ------------------------------------------------------------------ */
/* Sales and payouts                                                   */
/* ------------------------------------------------------------------ */

/** Final sales per day before the hold week. */
const SALES: Record<string, number> = {
  "2026-11-20": 443_250,
  "2026-11-21": 369_375,
  "2026-11-22": 221_625,
  "2026-11-23": 354_600,
  "2026-11-24": 325_050,
  "2026-11-25": 369_375,
  "2026-11-26": 339_825,
}

/** Days whose sales are still coming in: [so far today, final once the day ends]. */
const LIVE_SALES: Record<string, [number, number]> = {
  "2026-11-27": [HOLD_AMOUNT, 4_012_875],
  "2026-11-28": [586_500, 3_120_000],
  "2026-11-29": [412_000, 2_216_250],
}

/**
 * Sales for one day as seen at `now`: null for days that haven't started,
 * "so far" for today, final for past days. Undefined for days this
 * prototype has no record of (the Home chart fills those).
 */
export function salesFor(day: string, now: string): number | null | undefined {
  const today = dayOf(now)
  if (day > today) return null
  const live = LIVE_SALES[day]
  if (live) return day === today ? live[0] : live[1]
  return SALES[day]
}

/** Paid payouts, newest first. Each pays out the previous working day's sales. */
const PAID: { payoutDay: string; sales: string[]; ref: string }[] = [
  { payoutDay: "2026-11-27", sales: ["2026-11-26"], ref: "PO-261127-0487" },
  { payoutDay: "2026-11-26", sales: ["2026-11-25"], ref: "PO-261126-0451" },
  { payoutDay: "2026-11-25", sales: ["2026-11-24"], ref: "PO-261125-0419" },
  { payoutDay: "2026-11-24", sales: ["2026-11-23"], ref: "PO-261124-0388" },
  { payoutDay: "2026-11-23", sales: ["2026-11-20", "2026-11-21", "2026-11-22"], ref: "PO-261123-0352" },
]

/** Fri, Sat and Sun sales all pay out on Mon, 30 Nov. */
const UPCOMING_SALES_DAYS = ["2026-11-27", "2026-11-28", "2026-11-29"]

/** "Fri, 27 Nov", "Fri, 27 Nov and Sat, 28 Nov", "Fri, 20 Nov to Sun, 22 Nov" */
export function salesRange(days: string[]) {
  if (days.length === 1) return fmtDayShort(days[0])
  if (days.length === 2) return `${fmtDayShort(days[0])} and ${fmtDayShort(days[1])}`
  return `${fmtDayShort(days[0])} to ${fmtDayShort(days[days.length - 1])}`
}

export interface PayoutRow {
  id: string
  payoutDay: string
  /** `Mon, 30 Nov 2026` */
  label: string
  /** `Fri, 27 Nov sales, so far` */
  note: string
  status: PayoutStatus
  amount: number
  recipient: string
  reference: string
}

/* ------------------------------------------------------------------ */
/* Derived view model                                                  */
/* ------------------------------------------------------------------ */

/**
 * info    blue tint: Raven is working on it, nothing to do
 * action  solid red: she needs to act (information required only)
 * success solid green: payouts resumed
 */
export type BannerTone = "info" | "action" | "success"
export type BannerAction = "view" | "provide" | "dismiss"

export interface BannerModel {
  tone: BannerTone
  text: string
  action: BannerAction
  actionLabel: string
}

export interface SummaryModel {
  value: string
  label: string
  description: string
  status?: PayoutStatus
}

export interface ViewModel {
  banner: BannerModel | null
  balance: SummaryModel
  nextPayout: SummaryModel
  rows: PayoutRow[]
  /** Payout balance. Always equals the sum of the unpaid (On hold / Scheduled) rows. */
  balanceAmount: number
  /** `Payout due Mon, 30 Nov 2026, from Fri, 27 Nov sales` */
  dueLine: string
  onHold: boolean
}

export function isHeld(hold: HoldState) {
  return hold === "paused" || hold === "info-needed" || hold === "reviewing"
}

export function derive(input: { hold: HoldState; now: string; bannerDismissed: boolean }): ViewModel {
  const { hold, now, bannerDismissed } = input
  const onHold = isHeld(hold)
  const today = dayOf(now)

  // The upcoming payout: every sales day so far that pays out on Mon, 30 Nov.
  const salesDays = UPCOMING_SALES_DAYS.filter((d) => salesFor(d, now) != null)
  const balanceAmount = salesDays.reduce((s, d) => s + (salesFor(d, now) ?? 0), 0)
  const soFar = salesDays.at(-1) === today
  const upcomingStatus: PayoutStatus = onHold ? "on-hold" : "scheduled"

  const rows: PayoutRow[] = []
  if (salesDays.length > 0) {
    rows.push({
      id: `payout-${NEXT_PAYOUT_DAY}`,
      payoutDay: NEXT_PAYOUT_DAY,
      label: fmtDate(NEXT_PAYOUT_DAY),
      note: `${salesRange(salesDays)} sales${soFar ? ", so far" : ""}`,
      status: upcomingStatus,
      amount: balanceAmount,
      recipient: RECIPIENT,
      // No reference until a payout is actually sent (Paid only).
      reference: "-",
    })
  }
  for (const p of PAID) {
    rows.push({
      id: `payout-${p.payoutDay}`,
      payoutDay: p.payoutDay,
      label: fmtDate(p.payoutDay),
      note: `${salesRange(p.sales)} sales`,
      status: "paid",
      amount: p.sales.reduce((s, d) => s + (SALES[d] ?? 0), 0),
      recipient: RECIPIENT,
      reference: p.ref,
    })
  }

  const balance: SummaryModel = {
    value: fmtNaira(balanceAmount),
    label: "Payout balance",
    description: soFar ? "Includes today's sales so far" : "Sales not yet paid out",
    status: upcomingStatus,
  }

  const due = fmtDate(NEXT_PAYOUT_DAY)
  let nextPayout: SummaryModel
  if (hold === "paused" || hold === "reviewing") {
    nextPayout = { value: "Under review", label: "Next payout", description: `Was due ${due}` }
  } else if (hold === "info-needed") {
    nextPayout = {
      value: "Action required",
      label: "Next payout",
      description: "Send the details we asked for",
    }
  } else {
    nextPayout = {
      value: due,
      label: "Next payout",
      description: hold === "resumed" ? "Payouts are back on" : "Sent automatically on the next working day",
    }
  }

  const updateBy = fmtDayShort(UPDATE_BY)
  const dayTwo = today > HOLD_DAY
  let banner: BannerModel | null = null
  if (hold === "paused") {
    banner = {
      tone: "info",
      text: dayTwo
        ? `Payouts paused since ${fmtDate(HOLD_DAY)}. We're still reviewing. We'll update you by ${updateBy}.`
        : `Payouts paused for review. No action needed. We'll update you by ${updateBy}.`,
      action: "view",
      actionLabel: "View details",
    }
  } else if (hold === "info-needed") {
    banner = {
      tone: "action",
      text: "We need more information to finish our review.",
      action: "provide",
      actionLabel: "Provide details",
    }
  } else if (hold === "reviewing") {
    banner = {
      tone: "info",
      text: `Details received. We'll update you by ${updateBy}.`,
      action: "view",
      actionLabel: "View details",
    }
  } else if (hold === "resumed" && !bannerDismissed) {
    banner = {
      tone: "success",
      text: `Payouts resumed. Your next payout goes out on ${due}.`,
      action: "dismiss",
      actionLabel: "Dismiss",
    }
  }

  const dueLine = `Payout due ${due}, from ${salesRange(salesDays.length ? salesDays : [HOLD_DAY])} sales`

  return { banner, balance, nextPayout, rows, balanceAmount, dueLine, onHold }
}
