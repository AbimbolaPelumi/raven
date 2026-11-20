"use client"

import { Ellipsis } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusPill } from "@/components/status-pill"
import { fmtNaira, type PayoutRow } from "@/lib/proto"
import { cn } from "@/lib/utils"

interface PayoutsTableProps {
  rows: PayoutRow[]
  onOpenHold: () => void
}

// Figma widths from 1440 (the design width); tighter below it so every column stays visible down to 1024.
const COLS = [
  { label: "Payout for", w: "w-[150px] wide:w-[220px]" },
  { label: "Status", w: "w-[112px] wide:w-[130px]" },
  { label: "Settled amount", w: "w-[140px] wide:w-[170px]" },
  { label: "Payout amount", w: "w-[140px] wide:w-[170px]" },
  { label: "Recipient", w: "w-[160px] wide:w-[190px]" },
  { label: "Reference", w: "" },
]

/** Lines between rows only, no vertical lines. Clicking an On hold row opens the drawer. */
export function PayoutsTable({ rows, onOpenHold }: PayoutsTableProps) {
  return (
    <div className="border border-border-default bg-bg-base">
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
                aria-label={onHold ? `${row.label}, on hold. View hold details` : undefined}
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
                <TableCell className="px-3 wide:px-4">{fmtNaira(row.settled)}</TableCell>
                <TableCell className="px-3 wide:px-4">{fmtNaira(row.payout)}</TableCell>
                <TableCell className="px-3 wide:px-4">{row.recipient}</TableCell>
                <TableCell
                  className={cn(
                    "px-3 wide:px-4",
                    row.status !== "paid" && "opacity-70"
                  )}
                >
                  {row.reference}
                </TableCell>
                <TableCell className="px-3 text-center wide:px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Actions for ${row.label}`}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="inline-flex size-7 cursor-pointer items-center justify-center text-text-primary hover:bg-bg-muted"
                      >
                        <Ellipsis className="size-[18px]" strokeWidth={1.75} aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onHold ? (
                        <DropdownMenuItem onSelect={onOpenHold}>View hold details</DropdownMenuItem>
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
