"use client"

import { Check, Clock, Pause } from "lucide-react"

import { CopyButton } from "@/components/copy-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusPill } from "@/components/status-pill"
import { fmtDateShort, fmtNaira, type PayoutRow, type PayoutStatus } from "@/lib/proto"
import { cn } from "@/lib/utils"

interface PayoutsTableProps {
  rows: PayoutRow[]
  onOpenHold: () => void
}

// "Payout for" is the sales day: one payout per day, never summed.
// Proportional widths so the columns share the row evenly at any width.
// Everything left-aligned, same font and figures as the rest of the table.
// Recipient hides below 1024px.
const COLS = [
  { label: "Payout for", w: "w-[18%]", cell: "" },
  { label: "Status", w: "w-[13%]", cell: "" },
  { label: "Amount", w: "w-[22%]", cell: "" },
  { label: "Recipient", w: "w-[22%] max-lg:hidden", cell: "max-lg:hidden" },
  { label: "Reference", w: "", cell: "" },
]
const CELL = "px-4 wide:px-6"

const STATUS: Record<
  PayoutStatus,
  { label: string; icon: typeof Check; tint: string; tone: string }
> = {
  paid: { label: "Paid", icon: Check, tint: "bg-bg-success-subtle", tone: "text-icon-success" },
  "on-hold": { label: "On hold", icon: Pause, tint: "bg-bg-critical-subtle", tone: "text-icon-critical" },
  pending: { label: "Pending", icon: Clock, tint: "bg-bg-warning-subtle", tone: "text-icon-warning" },
}

function MobileRow({ row, onOpenHold }: { row: PayoutRow; onOpenHold: () => void }) {
  const st = STATUS[row.status]
  const Icon = st.icon
  const onHold = row.status === "on-hold"
  const sub = row.reference.startsWith("PO-") ? `${st.label} • ${row.reference}` : st.label
  const body = (
    <div className="flex items-center gap-3">
      <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", st.tint)}>
        <Icon className={cn("size-4", st.tone)} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-medium-strong text-text-primary">{fmtNaira(row.amount)}</p>
        <p className="truncate text-body-small text-text-secondary">{sub}</p>
      </div>
      <p className="shrink-0 self-start pt-0.5 text-body-small text-text-secondary">{fmtDateShort(row.salesDay)}</p>
    </div>
  )
  return (
    <li className="border-b border-border-default last:border-b-0">
      {onHold ? (
        <button
          type="button"
          onClick={onOpenHold}
          aria-label={`Payout for ${row.label}, ${fmtNaira(row.amount)}, on hold. View review details`}
          className="block w-full cursor-pointer px-4 py-3 text-left hover:bg-bg-subtle"
        >
          {body}
        </button>
      ) : (
        <div className="px-4 py-3">{body}</div>
      )}
    </li>
  )
}

/**
 * Mobile: a list grouped into Upcoming (On hold / Pending) and Paid. Each row
 * has a round status icon, the amount with "Status • reference" under it,
 * and the payout-for date on the right. On hold rows open the drawer.
 */
function MobileList({ rows, onOpenHold }: PayoutsTableProps) {
  const groups = [
    { title: "Upcoming", rows: rows.filter((r) => r.status !== "paid") },
    { title: "Paid", rows: rows.filter((r) => r.status === "paid") },
  ].filter((g) => g.rows.length > 0)
  return (
    <div className="flex flex-col gap-5 md:hidden">
      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`payouts-${g.title}`}>
          <h2 id={`payouts-${g.title}`} className="pb-2 text-body-medium-strong text-text-primary">
            {g.title}
          </h2>
          {/* Same chrome as the table and cards: square, bordered, lines between rows. */}
          <ul aria-label={`${g.title} payouts`} className="border border-border-default bg-bg-default">
            {g.rows.map((row) => (
              <MobileRow key={row.id} row={row} onOpenHold={onOpenHold} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/**
 * Payouts: a table from 768px up (lines between rows only), a grouped list below it.
 * Clicking an On hold payout opens the review drawer.
 */
export function PayoutsTable({ rows, onOpenHold }: PayoutsTableProps) {
  return (
    <>
      <MobileList rows={rows} onOpenHold={onOpenHold} />

      <div className="border border-border-default bg-bg-default max-md:hidden">
        <Table className="table-fixed text-body-medium">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-border-default">
            <TableRow className="h-12 hover:bg-transparent">
              {COLS.map((c) => (
                <TableHead
                  key={c.label}
                  className={cn("h-12 text-body-medium font-normal text-text-secondary", CELL, c.w, c.cell)}
                >
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const onHold = row.status === "on-hold"
              return (
                <TableRow
                  key={row.id}
                  tabIndex={onHold ? 0 : undefined}
                  aria-label={onHold ? `Payout for ${row.label}, on hold. View review details` : undefined}
                  onClick={onHold ? onOpenHold : undefined}
                  onKeyDown={
                    onHold
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            onOpenHold()
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "h-14 border-border-default text-text-primary hover:bg-bg-subtle",
                    onHold && "cursor-pointer"
                  )}
                >
                  <TableCell className={CELL}>{row.label}</TableCell>
                  <TableCell className={CELL}>
                    <StatusPill status={row.status} />
                  </TableCell>
                  <TableCell className={cn(CELL, COLS[2].cell)}>{fmtNaira(row.amount)}</TableCell>
                  <TableCell className={cn("truncate", CELL, COLS[3].cell)}>{row.recipient}</TableCell>
                  <TableCell className={cn("group/copy py-0", CELL)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("truncate", row.status !== "paid" && "opacity-70")}>
                        {row.reference}
                      </span>
                      {/* Only sent payouts have a reference to copy. */}
                      {row.reference.startsWith("PO-") && (
                        <CopyButton value={row.reference} label={`Copy reference ${row.reference}`} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
