import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface TimelineStep {
  title: string
  detail: string
  state: "done" | "current" | "upcoming"
}

/**
 * Vertical progress with connected markers.
 *  done      filled marker with a check
 *  current   blue ring with a dot and a soft one-way ripple (none with reduced motion)
 *  upcoming  empty marker
 */
export function ReviewTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol aria-label="Review progress" className="flex flex-col">
      {steps.map((s, i) => {
        const last = i === steps.length - 1
        return (
          <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden
                // Solid up to the current step, dotted after it (not reached yet).
                // Spaced 2px dashes with 4px gaps, so it reads clearly as "not yet".
                className={cn(
                  "absolute top-6 bottom-0 left-[9.5px] w-px",
                  s.state === "done"
                    ? "bg-text-primary"
                    : "bg-[linear-gradient(to_bottom,var(--border-strong)_2px,transparent_2px)] bg-[length:1px_6px]"
                )}
              />
            )}
            <span aria-hidden className="relative z-10 mt-0.5 size-5 shrink-0">
              {/* Ripple: one-way grow + fade (transform/opacity only), then rest. */}
              {s.state === "current" && (
                <span className="absolute inset-0 rounded-full bg-info-dot opacity-0 motion-safe:animate-[ripple_2.4s_cubic-bezier(0.23,1,0.32,1)_infinite]" />
              )}
              <span
                className={cn(
                  "relative flex size-5 items-center justify-center rounded-full",
                  s.state === "done" && "bg-brand-primary",
                  s.state === "current" && "border-2 border-info-dot bg-bg-base",
                  s.state === "upcoming" && "border border-border-strong bg-bg-base"
                )}
              >
                {s.state === "done" && <Check className="size-3 text-icon-inverse" strokeWidth={2.5} />}
                {s.state === "current" && <span className="size-2 rounded-full bg-info-dot" />}
              </span>
            </span>
            <div className="min-w-0 text-body-medium">
              <p className={cn(s.state === "upcoming" ? "text-text-secondary" : "text-text-primary", s.state === "current" && "text-body-medium-strong")}>
                {s.title}
                <span className="sr-only">
                  {s.state === "done" ? ", done" : s.state === "current" ? ", in progress" : ", upcoming"}
                </span>
              </p>
              <p className="text-text-secondary">{s.detail}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
