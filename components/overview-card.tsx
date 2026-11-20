"use client"

import { cn } from "@/lib/utils"

interface OverviewCardProps {
  title: string
  /** Big figure, e.g. "₦8.6M". */
  value?: string
  /** Change vs previous period, already formatted (e.g. "+4.2%"). Shown as plain grey text. */
  delta?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Overview card: title, optional value + change, and a body (chart or list).
 * No footer.
 */
export function OverviewCard({
  title,
  value,
  delta,
  className,
  children,
}: OverviewCardProps) {
  return (
    <section
      aria-label={title}
      className={cn("flex min-w-0 flex-col border border-border-default bg-bg-base", className)}
    >
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-body-medium text-text-secondary">{title}</h3>
        {value && (
          <div className="flex items-baseline gap-2">
            <p className="text-heading-large text-text-primary">{value}</p>
            {delta && <p className="text-body-small text-text-secondary">{delta} vs previous period</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
