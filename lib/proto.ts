/**
 * Prototype domain: types, simulated-time helpers, fixtures, and the single
 * `derive` function that turns store state into everything the UI shows.
 * Banner, cards, table rows, drawer and the Home chart all read from here, so
 * every number agrees by construction.
 *
 * Money model (same words everywhere):
 *  - Payout balance: money from sales that hasn't been paid out yet.
 *  - Payout: a transfer to the bank for one day's sales, paid automatically on
 *    the next working day. Days are never summed into one payout, so every
 *    payout reconciles to exactly one day of sales.
 *  - On hold: a payout that would normally go out but is paused. Nothing leaves
 *    the balance; new sales keep joining it and pay out after the review.
 */

/**
 * none        before any hold
 * paused      under review, Raven is doing the work, no action needed
 * resumed     hold cleared
 */
export type HoldState = "none" | "paused" | "resumed"
export type PayoutStatus = "paid" | "on-hold" | "pending"

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

/** "Expected this activity?": optional context she volunteers. */
export interface ContextNote {
  choice: string
  note: string
  files: UploadFile[]
  at: string
}

/**
 * Neutral on purpose: the app never tells her what the unusual activity was
 * (no "sales went up", no "increase"), so the options are ordinary business
 * events, not explanations of a spike.
 */
export const CONTEXT_CHOICES = [
  "A promotion or campaign",
  "A new product or service",
  "A change to how I sell",
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
/**
 * Raven promises an update (not a release) within 24 hrs of the hold, shown
 * in hours rather than a date. Live surfaces count down to this moment; the
 * alerts, sent at the hold, say "within 24 hrs". The payout itself is still
 * due Mon, 30 Nov (NEXT_PAYOUT_DAY).
 */
export const UPDATE_WITHIN_HRS = 24
export const UPDATE_DUE = addMinutes(HOLD_STARTED, UPDATE_WITHIN_HRS * 60)
export const HOLD_AMOUNT = 3_457_350
export const HOLD_HREF = "/payouts?hold=open"
export const SUPPORT_EMAIL = "support@raven.ng"
/** Opens her email app with the recipient, subject and body pre-filled. */
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  `Paused payouts (${HOLD_REF})`
)}&body=${encodeURIComponent(
  `Hi Raven support,\n\nI have a question about my paused payouts. My reference is ${HOLD_REF}.\n\n`
)}`
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

/** `27 Nov 2026` (no weekday; used where space is tight, e.g. the mobile list) */
export function fmtDateShort(iso: string) {
  const { y, m, day } = parse(iso)
  return `${day} ${MONTHS[m - 1]} ${y}`
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

function toMs(iso: string) {
  const { y, m, day, hh, mm } = parse(iso)
  return Date.UTC(y, m - 1, day, hh, mm)
}

/** "within 24 hrs", counting down to the promised update; never below 1 hr. */
export function updateWithin(now: string) {
  // Clamped to 1..24: before the hold starts (e.g. right after Reset) it would
  // otherwise read "25 hrs". Callers only show it while a hold is on.
  const raw = Math.ceil((toMs(UPDATE_DUE) - toMs(now)) / 3_600_000)
  const hrs = Math.min(UPDATE_WITHIN_HRS, Math.max(1, raw))
  return `within ${hrs} ${hrs === 1 ? "hr" : "hrs"}`
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
  // The account activity is under review, not the payouts: payouts are paused.
  pushTitle: "Payouts paused",
  pushBody: `We're reviewing recent activity on your account. No action needed. We'll update you within ${UPDATE_WITHIN_HRS} hrs.`,
  // 147 characters: fits one SMS (160 max).
  sms: `Raven: Payouts paused while we review recent activity on your account. No action needed. We'll update you within ${UPDATE_WITHIN_HRS} hrs. raven.ng/h/${HOLD_REF}`,
  emailSubject: "Your payouts are paused",
  emailPreview: `No action needed. We'll update you within ${UPDATE_WITHIN_HRS} hrs.`,
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
  // Friday's payout stays ₦3,457,350.00 after the day ends.
  "2026-11-27": [HOLD_AMOUNT, HOLD_AMOUNT],
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

/**
 * One payout per sales day, never summed across days, so every payout
 * reconciles to exactly one day of sales. A day's sales pay out on the next
 * working day, so Fri, Sat and Sun each get their own payout on Monday.
 * Paid payouts, newest sales day first.
 */
const PAID: { sales: string; payoutDay: string; ref: string }[] = [
  { sales: "2026-11-26", payoutDay: "2026-11-27", ref: "PO-261127-0487" },
  { sales: "2026-11-25", payoutDay: "2026-11-26", ref: "PO-261126-0451" },
  { sales: "2026-11-24", payoutDay: "2026-11-25", ref: "PO-261125-0419" },
  { sales: "2026-11-23", payoutDay: "2026-11-24", ref: "PO-261124-0388" },
  { sales: "2026-11-22", payoutDay: "2026-11-23", ref: "PO-261123-0352" },
  { sales: "2026-11-21", payoutDay: "2026-11-23", ref: "PO-261123-0351" },
  { sales: "2026-11-20", payoutDay: "2026-11-23", ref: "PO-261123-0350" },
]

/** Fri, Sat and Sun sales: three separate payouts, all due Mon, 30 Nov. */
const UPCOMING_SALES_DAYS = ["2026-11-27", "2026-11-28", "2026-11-29"]

/** "Fri, 27 Nov" or "Fri, 27 Nov to Tue, 1 Dec": reads the same for 2 days or 20. */
export function salesRange(days: string[]) {
  if (days.length === 1) return fmtDayShort(days[0])
  return `${fmtDayShort(days[0])} to ${fmtDayShort(days[days.length - 1])}`
}

export interface PayoutRow {
  id: string
  /** The sales day this payout is for. */
  salesDay: string
  /** When it goes (or went) out. Not shown in the table. */
  payoutDay: string
  /** "Payout for" column: `Fri, 27 Nov 2026` */
  label: string
  status: PayoutStatus
  amount: number
  recipient: string
  reference: string
}

/* ------------------------------------------------------------------ */
/* Derived view model                                                  */
/* ------------------------------------------------------------------ */

/**
 * Banner colour follows the payout status (On hold is red):
 * hold    solid red: payouts on hold, Raven is reviewing, nothing to do
 * success solid green: payouts resumed
 */
export type BannerTone = "hold" | "success"
export type BannerAction = "view" | "dismiss"

export interface BannerModel {
  tone: BannerTone
  text: string
  action: BannerAction
  actionLabel: string
}

/** Card status: On hold, Pending or no pending payout. */
export type CardStatus = "on-hold" | "pending" | "none"

export interface SummaryModel {
  value: string
  label: string
  status: CardStatus
  /** Plain sentence under the value, e.g. "You have 1 pending payout". */
  description: string
}

export interface ViewModel {
  banner: BannerModel | null
  nextPayout: SummaryModel
  rows: PayoutRow[]
  /** Payout balance. Always equals the sum of the unpaid (On hold / Scheduled) rows. */
  balanceAmount: number
  /** `1 payout, for Fri, 27 Nov` or `5 payouts, for Fri, 27 Nov to Tue, 1 Dec` */
  dueLine: string
  onHold: boolean
}

export function isHeld(hold: HoldState) {
  return hold === "paused"
}

export function derive(input: { hold: HoldState; now: string; bannerDismissed: boolean }): ViewModel {
  const { hold, now, bannerDismissed } = input
  const onHold = isHeld(hold)
  const today = dayOf(now)

  // Upcoming payouts: one per sales day so far, each due Mon, 30 Nov.
  // One payout per past sales day. Today's sales aren't a payout yet (they pay
  // out next working day), except the hold day itself, whose payout is the one
  // on hold. So on Sat, 28 Nov there is still only Friday's payout.
  const salesDays = UPCOMING_SALES_DAYS.filter(
    (d) => salesFor(d, now) != null && (d < today || d === HOLD_DAY)
  )
  const balanceAmount = salesDays.reduce((s, d) => s + (salesFor(d, now) ?? 0), 0)
  const upcomingStatus: PayoutStatus = onHold ? "on-hold" : "pending"

  const rows: PayoutRow[] = []
  for (const d of [...salesDays].reverse()) {
    rows.push({
      id: `payout-${d}`,
      salesDay: d,
      payoutDay: NEXT_PAYOUT_DAY,
      label: fmtDate(d),
      status: upcomingStatus,
      amount: salesFor(d, now) ?? 0,
      recipient: RECIPIENT,
      // No reference until a payout is actually sent (Paid only).
      reference: "-",
    })
  }
  for (const p of PAID) {
    rows.push({
      id: `payout-${p.sales}`,
      salesDay: p.sales,
      payoutDay: p.payoutDay,
      label: fmtDate(p.sales),
      status: "paid",
      amount: SALES[p.sales] ?? 0,
      recipient: RECIPIENT,
      reference: p.ref,
    })
  }

  const due = fmtDate(NEXT_PAYOUT_DAY)
  // One card: what the next payout is worth and where it stands.
  const status: CardStatus = balanceAmount === 0 ? "none" : upcomingStatus
  const count = salesDays.length
  const payouts = `${count} ${count === 1 ? "payout" : "payouts"}`
  const description =
    status === "none"
      ? "You have no pending payouts"
      : onHold
        ? `You have ${payouts} on hold`
        : `You have ${count} pending ${count === 1 ? "payout" : "payouts"}, due ${due}`
  const nextPayout: SummaryModel = {
    value: fmtNaira(balanceAmount),
    label: "Next payout",
    status,
    description,
  }

  const updateIn = updateWithin(now)
  const dayTwo = today > HOLD_DAY
  let banner: BannerModel | null = null
  if (hold === "paused") {
    banner = {
      tone: "hold",
      text: dayTwo
        ? `Payouts paused since ${fmtDate(HOLD_DAY)}. We're still reviewing. We'll update you ${updateIn}.`
        : `Payouts paused while we review recent activity on your account. No action needed. We'll update you ${updateIn}.`,
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

  // Count plus first-to-last day, so it scales however long the hold lasts.
  // No due date: a held payout isn't due on any date until the review ends.
  const n = Math.max(1, salesDays.length)
  const dueLine = `${n} ${n === 1 ? "payout" : "payouts"}, for ${salesRange(salesDays.length ? salesDays : [HOLD_DAY])}`

  return { banner, nextPayout, rows, balanceAmount, dueLine, onHold }
}
