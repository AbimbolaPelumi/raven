import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"



/**
 * Summary card. Mirrors Figma component "Summary card" (42:1219):
 * props value, label, description, link, showDescription, showLink, tone,
 * Description is a plain secondary sentence.
 * Tone "muted" is for a value that is unavailable or empty.
 */
const valueVariants = cva("text-heading-large", {
  variants: {
    tone: {
      default: "text-text-primary",
      muted: "text-text-tertiary",
    },
  },
  defaultVariants: { tone: "default" },
})

interface SummaryCardProps
  extends Omit<React.ComponentProps<"div">, "children">,
    VariantProps<typeof valueVariants> {
  value: string
  label: string
  description?: string
  link?: string
  href?: string
  /** Defaults to true when a description is given. */
  showDescription?: boolean
  /** Defaults to true when a link is given. */
  showLink?: boolean
  /** Makes the whole card a button (e.g. to open review details). */
  onActivate?: () => void
}

function SummaryCard({
  value,
  label,
  description,
  link,
  href = "#",
  showDescription = Boolean(description),
  showLink = Boolean(link),
  tone,
  onActivate,
  className,
  ...props
}: SummaryCardProps) {
  return (
    <div
      data-slot="summary-card"
      data-tone={tone ?? "default"}
      {...(onActivate && {
        role: "button",
        tabIndex: 0,
        onClick: onActivate,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onActivate()
          }
        },
      })}
      className={cn(
        onActivate && "cursor-pointer transition-colors hover:bg-bg-subtle",
        // Height comes from content only, like Figma. Side-by-side cards are
        // equalised by the parent grid (items-stretch), not by a fixed height.
        "flex min-w-0 flex-1 flex-col items-start overflow-clip border border-border-default bg-bg-default",
        className
      )}
      {...props}
    >
      {/* Title on top, value, then the status line. */}
      <div className="flex w-full flex-col gap-3 p-6 text-body-medium">
        <p className="text-text-primary">{label}</p>
        <div className="flex flex-col gap-1">
          <p className={valueVariants({ tone })}>{value}</p>
          {showDescription && (
            <p className="text-text-secondary">{description}</p>
          )}
        </div>
        {showLink && (
          <a href={href} className="w-fit text-text-primary hover:underline">
            {link}
          </a>
        )}
      </div>
    </div>
  )
}

export { SummaryCard }
export type { SummaryCardProps }
