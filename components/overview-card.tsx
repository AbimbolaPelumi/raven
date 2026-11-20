"use client"

import { toast } from "sonner"

import { cn } from "@/lib/utils"

interface OverviewCardProps {
  title: string
  /** Big figure, e.g. "₦8.6M". */
  value?: string
  /** Change vs previous period, already formatted (e.g. "+4.2%"). */
  delta?: string
  /** "up" is good (green), "down" is bad (red), "flat" is neutral. */
  deltaTone?: "up" | "down" | "flat"
  footer?: { text: string; action: string } | null
  className?: string
  children?: React.ReactNode
}

/**
 * Stripe-style overview card: title, optional value + change, a body (chart or
 * list) and a consistent "Updated … · More details" footer.
 */
export function OverviewCard({
  title,
  value,
  delta,
  deltaTone = "flat",
  footer = { text: "Updated just now", action: "More details" },
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
            {delta && (
              <p
                className={cn(
                  "text-body-small-strong",
                  deltaTone === "up" && "text-success-text",
                  deltaTone === "down" && "text-danger-text",
                  deltaTone === "flat" && "text-text-secondary"
                )}
              >
                {delta}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
      {footer && (
        <div className="flex items-center justify-between border-t border-border-default px-6 py-3 text-body-small text-text-tertiary">
          <span>{footer.text}</span>
          <button
            type="button"
            onClick={() => toast("This isn't part of the prototype.")}
            className="cursor-pointer text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
          >
            {footer.action}
          </button>
        </div>
      )}
    </section>
  )
}
