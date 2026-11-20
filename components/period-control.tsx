"use client"

import { CalendarDays, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PERIODS, type Period } from "@/lib/dashboard"

const LABEL: Record<Period, string> = { 7: "Last 7 days", 30: "Last 30 days", 90: "Last 90 days" }

/** Period picker: an outline dropdown button, same as the Payouts toolbar. */
export function PeriodControl({
  value,
  onChange,
}: {
  value: Period
  onChange: (p: Period) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Period: ${LABEL[value]}`}
          leadingIcon={<CalendarDays className="text-icon-primary" strokeWidth={1.75} />}
          trailingIcon={<ChevronDown className="text-icon-primary" strokeWidth={1.75} />}
        >
          {LABEL[value]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={String(value)} onValueChange={(v) => onChange(Number(v) as Period)}>
          {PERIODS.map((p) => (
            <DropdownMenuRadioItem key={p} value={String(p)}>
              {LABEL[p]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
