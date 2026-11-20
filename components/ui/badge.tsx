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
        paid: "bg-success-bg text-success-text",
        "on-hold": "bg-hold-bg text-hold-text",
        pending: "bg-pending-bg text-pending-text",
        succeeded: "bg-success-bg text-success-text",
        refunded: "bg-info-bg text-info-text",
        failed: "bg-danger-bg text-danger-text",
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
