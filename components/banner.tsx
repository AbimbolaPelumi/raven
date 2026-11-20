"use client"

import { CircleAlert, CircleCheck, Info, X } from "lucide-react"

import type { BannerModel } from "@/lib/proto"
import { cn } from "@/lib/utils"

interface BannerProps {
  banner: BannerModel | null
  onAction: (a: BannerModel["action"]) => void
}

/**
 * Full-width strip under the header, the same on every page. The wrapper
 * animates its height so the banner appearing or going away glides.
 *
 *  - info    blue tint: Raven is working on it, nothing to do. "View details".
 *  - action  solid red: she needs to act (information required only).
 *  - success solid green: payouts resumed (dismissible).
 *
 * Text wraps on narrow screens and the link always stays visible.
 */
export function Banner({ banner, onAction }: BannerProps) {
  const tone = banner?.tone
  const Icon = tone === "action" ? CircleAlert : tone === "success" ? CircleCheck : Info

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out",
        banner ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className="overflow-hidden">
        {banner && (
          <div
            role="status"
            data-tone={tone}
            className={cn(
              "flex items-start gap-2 py-2.5 pr-4 pl-4 text-body-medium md:items-center md:pl-6",
              tone === "info" && "border-b border-info-dot/25 bg-info-bg text-info-text",
              tone === "action" && "bg-hold-strong text-hold-on-strong",
              tone === "success" && "bg-success-strong text-hold-on-strong"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0 md:mt-0",
                tone === "info" ? "text-icon-info" : "text-icon-on-strong"
              )}
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <p className="min-w-0 text-body-medium-strong">{banner.text}</p>
              {banner.action !== "dismiss" && (
                <button
                  type="button"
                  onClick={() => onAction(banner.action)}
                  className={cn(
                    "shrink-0 cursor-pointer text-body-medium-strong underline underline-offset-2 hover:no-underline",
                    tone !== "info" && "focus-visible:outline-white"
                  )}
                >
                  {banner.actionLabel}
                </button>
              )}
            </div>
            {banner.action === "dismiss" && (
              <button
                type="button"
                onClick={() => onAction("dismiss")}
                aria-label="Dismiss"
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-on-strong hover:bg-white/15 focus-visible:outline-white"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
