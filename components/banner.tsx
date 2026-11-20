"use client"

import { CircleAlert, CircleCheck, Info, X } from "lucide-react"

import type { BannerModel } from "@/lib/proto"
import { cn } from "@/lib/utils"

interface BannerProps {
  banner: BannerModel | null
  onAction: (a: BannerModel["action"]) => void
}

/**
 * Full-width strip under the header. The wrapper animates its height so the
 * banner appearing or going away glides instead of snapping the page.
 *
 * Treatments, so the merchant can tell the states apart at a glance:
 *  - hold    solid red: payouts are paused while the processor reviews; "Learn more"
 *            opens the review details.
 *  - info    tinted blue: review pending after the merchant replied; "Learn more".
 *  - action  solid blue: the processor needs something from the merchant.
 *  - success solid green: payouts resumed (dismissible).
 */
export function Banner({ banner, onAction }: BannerProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        banner ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className="overflow-hidden">
        {(banner?.tone === "hold" || banner?.tone === "info") && (
          <div
            role="status"
            className={cn(
              "flex items-center gap-2 py-2.5 pr-4 pl-6 text-body-medium",
              banner.tone === "hold"
                ? "bg-hold-strong text-hold-on-strong"
                : "border-b border-info-dot/25 bg-info-bg text-info-text"
            )}
          >
            {banner.tone === "hold" ? (
              <CircleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            ) : (
              <Info className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            )}
            <p className="min-w-0 flex-1">
              <span className="text-body-medium-strong">{banner.title}</span>{" "}
              <span>{banner.body}</span>
            </p>
            <button
              type="button"
              onClick={() => onAction(banner.action)}
              className={cn(
                "shrink-0 cursor-pointer text-body-medium-strong underline underline-offset-2 hover:no-underline",
                banner.tone === "hold" && "focus-visible:outline-white"
              )}
            >
              {banner.actionLabel}
            </button>
          </div>
        )}

        {banner?.tone === "action" && (
          <div
            role="status"
            className="flex items-center gap-2 bg-info-strong py-2.5 pr-4 pl-6 text-body-medium text-hold-on-strong"
          >
            <Info className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <p className="min-w-0 flex-1 text-body-medium-strong">{banner.title}</p>
            <button
              type="button"
              onClick={() => onAction(banner.action)}
              className="shrink-0 cursor-pointer text-body-medium-strong underline underline-offset-2 hover:no-underline focus-visible:outline-white"
            >
              {banner.actionLabel}
            </button>
          </div>
        )}

        {banner?.tone === "success" && (
          <div
            role="status"
            className="flex items-center gap-2 bg-success-strong py-2.5 pr-4 pl-6 text-body-medium text-hold-on-strong"
          >
            <CircleCheck className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <p className="min-w-0">
              <span className="text-body-medium-strong">{banner.title}</span>{" "}
              <span>{banner.body}</span>
            </p>
            <button
              type="button"
              onClick={() => onAction("dismiss")}
              aria-label="Dismiss"
              className="ml-auto flex size-6 shrink-0 cursor-pointer items-center justify-center hover:bg-white/15 focus-visible:outline-white"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
