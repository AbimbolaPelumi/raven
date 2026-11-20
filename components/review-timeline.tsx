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
 *  current   blue ring with a dot, slow halo (off with reduced motion)
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
                className={cn(
                  "absolute top-6 bottom-0 left-[9px] w-px",
                  s.state === "done" ? "bg-text-primary" : "bg-border-strong"
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-0.5 flex size-[19px] shrink-0 items-center justify-center rounded-full",
                s.state === "done" && "bg-brand-primary",
                s.state === "current" &&
                  "border-2 border-info-dot bg-bg-base motion-safe:animate-[ring-pulse_2.4s_ease-in-out_infinite]",
                s.state === "upcoming" && "border border-border-strong bg-bg-base"
              )}
            >
              {s.state === "done" && <Check className="size-3 text-icon-inverse" strokeWidth={2.5} />}
              {s.state === "current" && <span className="size-[7px] rounded-full bg-info-dot" />}
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
