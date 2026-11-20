"use client"

import { useMemo } from "react"
import { CircleCheck, X } from "lucide-react"

import { ContextSection } from "@/components/context-section"
import { ReviewTimeline, type TimelineStep } from "@/components/review-timeline"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import {
  HOLD_REF,
  SUPPORT_MAILTO,
  HOLD_STARTED,
  NEXT_PAYOUT_DAY,
  updateWithin,
  derive,
  fmtDate,
  fmtDateTime,
  fmtDayShort,
  fmtNaira,
  fmtTime,
} from "@/lib/proto"
import { takeOpener, useProto } from "@/lib/store"
import { cn } from "@/lib/utils"


function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-body-medium">
      <dt className="shrink-0 text-text-secondary">{label}</dt>
      <dd className="text-right text-text-primary">{value}</dd>
    </div>
  )
}

function Section({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-3 border-t border-border-default py-6", className)}>
      {title && <h3 className="text-heading-small text-text-primary">{title}</h3>}
      {children}
    </section>
  )
}

/**
 * The review drawer. Right-side drawer from 768px up, full-screen sheet below.
 * Sticky header and footer, scrolling body. Radix traps focus, Esc closes and
 * focus goes back to whatever opened it.
 */
export function HoldDrawer() {
  const hold = useProto((s) => s.hold)
  const now = useProto((s) => s.now)
  const bannerDismissed = useProto((s) => s.bannerDismissed)
  const drawerOpen = useProto((s) => s.drawerOpen)
  const context = useProto((s) => s.context)
  const resumedAt = useProto((s) => s.resumedAt)
  const closeDrawer = useProto((s) => s.closeDrawer)

  const vm = useMemo(() => derive({ hold, now, bannerDismissed }), [hold, now, bannerDismissed])

  const open = drawerOpen && hold !== "none"
  const resumed = hold === "resumed"
  const updateIn = updateWithin(now)

  const title = resumed ? "Hold lifted" : "Payouts paused"

  const steps: TimelineStep[] = [
    {
      title: "Payouts paused",
      detail: `${fmtDayShort(HOLD_STARTED)}, ${fmtTime(HOLD_STARTED)}`,
      state: "done",
    },
    ...(context
      ? [{ title: "You added context", detail: `${fmtDayShort(context.at)}, ${fmtTime(context.at)}`, state: "done" as const }]
      : []),
    { title: "Reviewing account activity", detail: "We're checking recent activity on your account", state: "current" },
    { title: "Next update", detail: updateIn[0].toUpperCase() + updateIn.slice(1), state: "upcoming" },
  ]

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) closeDrawer()
      }}
    >
      <SheetContent
        onCloseAutoFocus={(e) => {
          const el = takeOpener()
          if (el?.isConnected) {
            e.preventDefault()
            el.focus()
          }
        }}
        // The demo panel, push card and alerts preview live outside the drawer on purpose.
        onInteractOutside={(e) => {
          const t = e.target as HTMLElement | null
          if (t?.closest("[data-proto-overlay]")) e.preventDefault()
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default px-4 py-4 md:px-6">
          <SheetTitle className="text-heading-medium">{title}</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            aria-label="Close"
            className="-mr-2"
          >
            <X className="size-5 text-icon-primary" strokeWidth={1.75} />
          </Button>
        </header>
        <SheetDescription className="sr-only">
          {`Your payouts are paused while we review recent activity on your account. We'll update you ${updateIn}.`}
        </SheetDescription>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 md:px-6">
          {resumed ? (
            <>
              <div className="flex flex-col gap-1 pt-6 pb-6">
                <p className="text-heading-large text-text-primary">{fmtNaira(vm.balanceAmount)}</p>
                <p className="text-body-medium text-text-secondary">Payout pending</p>
              </div>
              <Section>
                <dl className="flex flex-col gap-4">
                  <DetailRow label="Hold lifted" value={fmtDate(resumedAt ?? now)} />
                  <DetailRow label="Next payout" value={fmtDate(NEXT_PAYOUT_DAY)} />
                </dl>
              </Section>
              <Section>
                <div className="flex items-start gap-2.5 text-body-medium text-text-primary">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-icon-success" strokeWidth={1.75} aria-hidden />
                  <p>Payouts are back on. You don&apos;t need to do anything else.</p>
                </div>
              </Section>
            </>
          ) : (
            <>
              {/* 1. Money */}
              <div className="flex flex-col gap-1 py-6">
                <p className="text-heading-large text-text-primary">
                  {fmtNaira(vm.balanceAmount)} on hold
                </p>
                <p className="text-body-medium text-text-primary">{vm.dueLine}</p>
                <p className="text-body-medium text-text-secondary">
                  You can keep accepting payments as usual, and new sales are paid out after the review.
                </p>
              </div>

              {/* 2. Details */}
              <Section>
                <dl className="flex flex-col gap-3">
                  <DetailRow label="Paused since" value={fmtDateTime(HOLD_STARTED)} />
                  <DetailRow label="Reason" value="Unusual activity on your account" />
                  <DetailRow label="Reference" value={HOLD_REF} />
                </dl>
              </Section>

              {/* 3. Progress */}
              <Section title="Progress">
                <ReviewTimeline steps={steps} />
              </Section>

              {/* 4. Optional context */}
              {hold === "paused" && (
                <div className="border-t border-border-default py-6">
                  <ContextSection />
                </div>
              )}

            </>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border-default px-4 py-4 md:px-6">
          <>
              {/* Opens her email app: to support, subject and body (with the reference) pre-filled. */}
              <Button variant="ghost" className="-ml-2" asChild>
                <a href={SUPPORT_MAILTO}>Contact support</a>
              </Button>
              <Button variant="outline" onClick={closeDrawer}>
                Close
              </Button>
          </>
        </footer>
      </SheetContent>
    </Sheet>
  )
}
