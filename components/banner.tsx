"use client"

import { CircleAlert, CircleCheck, X } from "lucide-react"

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
 * Colour follows the payout status: On hold is red.
 * Always filled (solid), never a tint:
 *  - hold    solid red: payouts on hold, Raven is reviewing, nothing to do. "View details".
 *  - action  solid red: on hold and she needs to act (information required). "Provide details".
 *  - success solid green: payouts resumed (dismissible).
 *
 * Text wraps on narrow screens and the link always stays visible.
 */
export function Banner({ banner, onAction }: BannerProps) {
  const tone = banner?.tone
  const Icon = tone === "success" ? CircleCheck : CircleAlert

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
              (tone === "hold" || tone === "action") && "bg-hold-strong text-hold-on-strong",
              tone === "success" && "bg-success-strong text-hold-on-strong"
            )}
          >
            <Icon
              className="mt-0.5 size-4 shrink-0 text-icon-on-strong md:mt-0"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <p className="min-w-0 text-body-medium-strong">{banner.text}</p>
              {banner.action !== "dismiss" && (
                <button
                  type="button"
                  onClick={() => onAction(banner.action)}
                  className="shrink-0 cursor-pointer text-body-medium-strong link-sweep focus-visible:outline-white"
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
                // -my-0.5: the 24px target sits inside the 20px text line, so this banner
                // is exactly as tall as the others (no layout shift between states).
                className="-my-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-on-strong hover:bg-white/15 focus-visible:outline-white"
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
