"use client"

import { PERIODS, type Period } from "@/lib/dashboard"
import { cn } from "@/lib/utils"

/** Compact segmented control (7d / 30d / 90d). Same pattern as the theme control. */
export function PeriodControl({
  value,
  onChange,
}: {
  value: Period
  onChange: (p: Period) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Period"
      className="flex h-9 border border-border-default bg-bg-base"
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "cursor-pointer px-3.5 text-body-medium-strong transition-colors",
            value === p
              ? "bg-brand-primary text-brand-on"
              : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
          )}
        >
          {p}d
        </button>
      ))}
    </div>
  )
}
