/**
 * Prototype domain: types, simulated-time helpers, fixtures, and the single
 * `derive` function that turns store state into everything the UI shows.
 * Banner, cards, table rows and drawer all read from here, so every number
 * agrees by construction.
 */

/**
 * none        before any hold
 * paused      Scenario 1: processor-led internal review, no action needed
 * info-needed Scenario 2: processor asked the merchant for more information
 * reviewing   merchant submitted it; review pending again
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

export interface Submission {
  reason: string
  files: UploadFile[]
  at: string
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const HOLD_REF = "HLD-261127-0412"
export const RECIPIENT = "GTBank •••• 4821"
export const HOLD_DAY = "2026-11-27"
export const HOLD_STARTED = "2026-11-27T15:12"
export const RESET_NOW = "2026-11-27T15:00"
export const CLEARED_NOW = "2026-11-28T10:05"
export const NEXT_PAYOUT_DAY = "2026-11-30"
export const HOLD_AMOUNT = 3_457_350
/** Two days after the hold was placed (Fri 27 3:12pm -> Sun 29 3:12pm). */
export const TWO_DAYS_LATER = "2026-11-29T15:12"
export const HOLD_HREF = "/payouts?hold=open"
export const MAX_FILE_BYTES = 10 * 1024 * 1024

/* ------------------------------------------------------------------ */
/* Simulated time. `now` is a naive "YYYY-MM-DDTHH:mm" string (Lagos).  */
/* ------------------------------------------------------------------ */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function parse(iso: string) {
  const [d, t = "00:00"] = iso.split("T")
  const [y, m, day] = d.split("-").map(Number)
  const [hh, mm] = t.split(":").map(Number)
  return { y, m, day, hh, mm }
}

/** `Fri, 27 Nov 2026` */
export function fmtDate(iso: string) {
  const { y, m, day } = parse(iso)
  const wd = DAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()]
  return `${wd}, ${day} ${MONTHS[m - 1]} ${y}`
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
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

/**
 * Daily payouts that accumulate while money is held. A day's row appears at
 * 3:00pm that day, so on the hold day itself there is just Friday's, and
 * clearing the hold the next morning does not pull in Saturday's.
 */
export const HELD_ROWS = [
  { day: "2026-11-27", amount: HOLD_AMOUNT },
  { day: "2026-11-28", amount: 2_955_000 },
  { day: "2026-11-29", amount: 2_216_250 },
]

export interface PaidRow {
  day: string
  amount: number
  ref: string
}

export const PAID_ROWS: PaidRow[] = [
  { day: "2026-11-26", amount: 339_825, ref: "PO-261127-0487" },
  { day: "2026-11-25", amount: 369_375, ref: "PO-261126-0451" },
  { day: "2026-11-24", amount: 325_050, ref: "PO-261125-0419" },
  { day: "2026-11-23", amount: 354_600, ref: "PO-261124-0388" },
  { day: "2026-11-22", amount: 221_625, ref: "PO-261123-0352" },
  { day: "2026-11-21", amount: 369_375, ref: "PO-261123-0351" },
  { day: "2026-11-20", amount: 443_250, ref: "PO-261121-0318" },
]

export interface PayoutRow {
  id: string
  day: string
  label: string
  status: PayoutStatus
  settled: number
  payout: number
  recipient: string
  reference: string
}

/* ------------------------------------------------------------------ */
/* Derived view model                                                  */
/* ------------------------------------------------------------------ */

/**
 * hold    solid red: payouts are paused (internal review, nothing to do)
 * info    tint: review pending, nothing to do
 * action  solid blue: the processor needs something from the merchant
 * success solid green: payouts resumed
 */
export type BannerTone = "hold" | "info" | "action" | "success"
export type BannerAction = "view" | "provide" | "dismiss"

export interface BannerModel {
  tone: BannerTone
  title: string
  body: string
  action: BannerAction
  actionLabel?: string
}

export interface SummaryModel {
  value: string
  label: string
  description: string
}

export interface ViewModel {
  banner: BannerModel | null
  balance: SummaryModel
  nextPayout: SummaryModel
  rows: PayoutRow[]
  /** The payout balance. Equals the Fri 27 row in every state. */
  balanceAmount: number
}

export function derive(input: {
  hold: HoldState
  now: string
  bannerDismissed: boolean
}): ViewModel {
  const { hold, now, bannerDismissed } = input

  // There is already money in the payout balance before any hold: Friday's
  // payout is scheduled. A hold freezes that money (On hold, no reference yet)
  // and keeps freezing each new day's payout while it lasts; clearing it puts
  // them all back to Scheduled. Rows, balance and drawer all sum the same list.
  const onHold = hold === "paused" || hold === "info-needed" || hold === "reviewing"

  const held = HELD_ROWS.filter((r) => `${r.day}T15:00` <= now)
  const rows: PayoutRow[] = held
    .map((r) => ({
      id: `held-${r.day}`,
      day: r.day,
      label: fmtDate(r.day),
      status: (onHold ? "on-hold" : "scheduled") as PayoutStatus,
      settled: r.amount,
      payout: r.amount,
      recipient: RECIPIENT,
      // No reference until a payout is actually sent (Paid only).
      reference: "-",
    }))
    .reverse() // newest first
  for (const r of PAID_ROWS) {
    rows.push({
      id: r.day,
      day: r.day,
      label: fmtDate(r.day),
      status: "paid",
      settled: r.amount,
      payout: r.amount,
      recipient: RECIPIENT,
      reference: r.ref,
    })
  }

  const balanceAmount = held.reduce((sum, r) => sum + r.amount, 0)
  const across = held.length > 1 ? ` across ${held.length} payouts` : ""

  const balance: SummaryModel = {
    value: fmtNaira(balanceAmount),
    label: "Payout balance",
    description: `${onHold ? "On hold" : "Scheduled"}${across}`,
  }

  let nextPayout: SummaryModel
  switch (hold) {
    case "paused":
      nextPayout = {
        value: "Paused",
        label: "Next payout",
        description: "Your payouts are temporarily paused while we review recent activity.",
      }
      break
    case "info-needed":
      nextPayout = {
        value: "Action required",
        label: "Next payout",
        description: "We need more information to complete our review.",
      }
      break
    case "reviewing":
      nextPayout = {
        value: "Paused",
        label: "Next payout",
        description: "We're reviewing your details",
      }
      break
    case "resumed":
      nextPayout = {
        value: fmtDate(NEXT_PAYOUT_DAY),
        label: "Next payout",
        description: "Payouts are back on",
      }
      break
    default:
      nextPayout = {
        value: fmtDate(NEXT_PAYOUT_DAY),
        label: "Next payout",
        description: "Sent automatically on the next working day",
      }
  }

  let banner: BannerModel | null = null
  if (hold === "paused") {
    banner = {
      tone: "hold",
      title: "We've temporarily paused your payouts while we review recent account activity.",
      body: "No action is needed right now.",
      action: "view",
      actionLabel: "Learn more",
    }
  } else if (hold === "info-needed") {
    banner = {
      tone: "action",
      title: "We need some additional information to continue reviewing your payouts.",
      body: "",
      action: "provide",
      actionLabel: "Provide details",
    }
  } else if (hold === "reviewing") {
    banner = {
      tone: "info",
      title: "We're reviewing your details.",
      body: "We'll reply within one working day.",
      action: "view",
      actionLabel: "Learn more",
    }
  } else if (hold === "resumed" && !bannerDismissed) {
    banner = {
      tone: "success",
      title: "Payouts resumed.",
      body: `Your next payout goes out on ${fmtDate(NEXT_PAYOUT_DAY)}.`,
      action: "dismiss",
      actionLabel: "Dismiss",
    }
  }

  return { banner, balance, nextPayout, rows, balanceAmount }
}
