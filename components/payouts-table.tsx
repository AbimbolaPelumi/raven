"use client"

import { ChevronRight, Ellipsis } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusPill } from "@/components/status-pill"
import { fmtNaira, type PayoutRow } from "@/lib/proto"
import { cn } from "@/lib/utils"

interface PayoutsTableProps {
  rows: PayoutRow[]
  onOpenHold: () => void
}

// Tighter below 1440 so every column stays visible down to 768.
const COLS = [
  { label: "Payout date", w: "w-[150px] wide:w-[190px]" },
  { label: "Status", w: "w-[112px] wide:w-[130px]" },
  { label: "Sales from", w: "w-[200px] wide:w-[260px]" },
  { label: "Amount", w: "w-[140px] wide:w-[170px]" },
  { label: "Recipient", w: "w-[150px] wide:w-[180px] max-lg:hidden" },
  { label: "Reference", w: "" },
]

function RowActions({ row, onOpenHold }: { row: PayoutRow; onOpenHold: () => void }) {
  const onHold = row.status === "on-hold"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${row.label}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="inline-flex size-7 cursor-pointer items-center justify-center text-icon-primary hover:bg-bg-muted"
        >
          <Ellipsis className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onHold ? (
          <DropdownMenuItem onSelect={onOpenHold}>View review details</DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard?.writeText(row.reference)
              toast.success("Reference copied")
            }}
            disabled={!row.reference.startsWith("PO-")}
          >
            Copy reference
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Payouts: a table from 768px up (lines between rows only), a list below it.
 * Clicking an On hold payout opens the review drawer.
 */
export function PayoutsTable({ rows, onOpenHold }: PayoutsTableProps) {
  return (
    <>
      {/* Mobile list: date and status left, amount right, sales note below. */}
      <ul aria-label="Payouts" className="border border-border-default bg-bg-base md:hidden">
        {rows.map((row) => {
          const onHold = row.status === "on-hold"
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col items-start gap-1">
                  <span className="text-body-medium text-text-primary">{row.label}</span>
                  <StatusPill status={row.status} />
                </div>
                <span className="flex items-center gap-1 text-body-medium-strong text-text-primary">
                  {fmtNaira(row.amount)}
                  {onHold && (
                    <ChevronRight className="size-4 text-icon-tertiary" strokeWidth={1.75} aria-hidden />
                  )}
                </span>
              </div>
              <p className="mt-1.5 text-body-small text-text-secondary">{row.note}</p>
            </>
          )
          return (
            <li key={row.id} className="border-b border-border-default last:border-b-0">
              {onHold ? (
                <button
                  type="button"
                  onClick={onOpenHold}
                  aria-label={`${row.label}, ${fmtNaira(row.amount)}, on hold. View review details`}
                  className="block w-full cursor-pointer px-4 py-3 text-left hover:bg-bg-subtle"
                >
                  {body}
                </button>
              ) : (
                <div className="px-4 py-3">{body}</div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="border border-border-default bg-bg-base max-md:hidden">
        <Table className="table-fixed text-body-medium">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-border-default">
            <TableRow className="h-12 hover:bg-transparent">
              {COLS.map((c) => (
                <TableHead
                  key={c.label}
                  className={cn("h-12 px-3 text-body-medium font-normal text-text-head wide:px-4", c.w)}
                >
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="h-12 w-[56px] px-3 wide:w-[72px] wide:px-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const onHold = row.status === "on-hold"
              return (
                <TableRow
                  key={row.id}
                  tabIndex={onHold ? 0 : undefined}
                  aria-label={onHold ? `${row.label}, on hold. View review details` : undefined}
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
                  <TableCell className="px-3 wide:px-4">{row.label}</TableCell>
                  <TableCell className="px-3 wide:px-4">
                    <StatusPill status={row.status} />
                  </TableCell>
                  <TableCell className="truncate px-3 text-text-secondary wide:px-4" title={row.note}>
                    {row.note}
                  </TableCell>
                  <TableCell className="px-3 wide:px-4">{fmtNaira(row.amount)}</TableCell>
                  <TableCell className="px-3 max-lg:hidden wide:px-4">{row.recipient}</TableCell>
                  <TableCell className={cn("truncate px-3 wide:px-4", row.status !== "paid" && "opacity-70")}>
                    {row.reference}
                  </TableCell>
                  <TableCell className="px-3 text-center wide:px-4">
                    <RowActions row={row} onOpenHold={onOpenHold} />
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
