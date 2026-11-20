import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Base for StatusPill. Fully rounded, tinted background, 11px medium label.
 * Variants map to the three payout statuses.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-label-xsmall-strong whitespace-nowrap",
  {
    variants: {
      variant: {
        paid: "bg-bg-success-subtle text-text-success",
        "on-hold": "bg-bg-critical-subtle text-text-critical",
        pending: "bg-bg-warning-subtle text-text-warning",
        succeeded: "bg-bg-success-subtle text-text-success",
        refunded: "bg-bg-info-subtle text-text-info",
        failed: "bg-bg-critical-subtle text-text-critical",
      },
    },
    defaultVariants: {
      variant: "paid",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
