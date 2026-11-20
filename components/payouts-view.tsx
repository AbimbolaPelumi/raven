"use client"

import { useMemo, useState } from "react"
import { CalendarDays, ChevronDown, Download } from "lucide-react"
import { toast } from "sonner"

import { PayoutsTable } from "@/components/payouts-table"
import { SummaryCard } from "@/components/summary-card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { derive, type PayoutStatus } from "@/lib/proto"
import { useProto } from "@/lib/store"

type StatusFilter = "all" | PayoutStatus
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "on-hold", label: "On hold" },
  { value: "scheduled", label: "Scheduled" },
]

export function PayoutsView() {
  const hold = useProto((s) => s.hold)
  const now = useProto((s) => s.now)
  const bannerDismissed = useProto((s) => s.bannerDismissed)
  const openDrawer = useProto((s) => s.openDrawer)

  const [status, setStatus] = useState<StatusFilter>("all")

  const vm = useMemo(() => derive({ hold, now, bannerDismissed }), [hold, now, bannerDismissed])

  const rows = status === "all" ? vm.rows : vm.rows.filter((r) => r.status === status)
  const statusLabel = FILTERS.find((f) => f.value === status)?.label ?? "All"

  // The shell supplies sidebar, header, banner, modal and page padding.
  return (
    <>
      <h1 className="text-display-medium text-text-primary">Payouts</h1>

      <div className="flex items-stretch gap-6">
        <SummaryCard
          value={vm.balance.value}
          label={vm.balance.label}
          description={vm.balance.description}
        />
        <SummaryCard
          value={vm.nextPayout.value}
          label={vm.nextPayout.label}
          description={vm.nextPayout.description}
          // While a review is running the card opens the review details.
          onActivate={hold === "none" || hold === "resumed" ? undefined : () => openDrawer()}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                leadingIcon={<CalendarDays strokeWidth={1.75} />}
                trailingIcon={<ChevronDown strokeWidth={1.75} />}
              >
                Last 30 days
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value="30">
                <DropdownMenuRadioItem value="30">Last 30 days</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" trailingIcon={<ChevronDown strokeWidth={1.75} />}>
                Status: {statusLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={status}
                onValueChange={(v) => setStatus(v as StatusFilter)}
              >
                {FILTERS.map((f) => (
                  <DropdownMenuRadioItem key={f.value} value={f.value}>
                    {f.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="outline"
          leadingIcon={<Download strokeWidth={1.75} />}
          onClick={() => toast("Export isn't part of this prototype.")}
        >
          Export
        </Button>
      </div>

      {rows.length > 0 ? (
        <PayoutsTable rows={rows} onOpenHold={() => openDrawer()} />
      ) : (
        <div className="border border-border-default py-12 text-center text-body-medium text-text-secondary">
          No payouts match this filter.
        </div>
      )}
    </>
  )
}
