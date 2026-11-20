"use client"

import { useMemo } from "react"
import { CircleAlert, CircleCheck, Loader2, X } from "lucide-react"

import { ContextSection } from "@/components/context-section"
import { FileField, FileRow } from "@/components/file-upload"
import { ReviewTimeline, type TimelineStep } from "@/components/review-timeline"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
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

function SendError({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 bg-danger-bg px-3 py-2.5 text-body-medium text-danger-text"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-icon-danger" strokeWidth={1.75} aria-hidden />
      <span className="flex-1">Couldn&apos;t send. Try again.</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="flex size-5 shrink-0 cursor-pointer items-center justify-center text-icon-danger hover:opacity-70"
      >
        <X className="size-4" strokeWidth={1.75} />
      </button>
    </div>
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
  const form = useProto((s) => s.form)
  const sending = useProto((s) => s.sending)
  const sendError = useProto((s) => s.sendError)
  const submission = useProto((s) => s.submission)
  const context = useProto((s) => s.context)
  const resumedAt = useProto((s) => s.resumedAt)
  const closeDrawer = useProto((s) => s.closeDrawer)
  const dismissSendError = useProto((s) => s.dismissSendError)
  const setForm = useProto((s) => s.setForm)
  const send = useProto((s) => s.send)

  const vm = useMemo(() => derive({ hold, now, bannerDismissed }), [hold, now, bannerDismissed])

  const open = drawerOpen && hold !== "none"
  const needed = hold === "info-needed"
  const resumed = hold === "resumed"
  const updateIn = updateWithin(now)

  const busy = form.files.some((f) => f.status !== "done")
  const canSend = needed && form.note.trim().length > 0 && !busy && !sending

  const title = resumed
    ? "Hold lifted"
    : needed
      ? "We need a little more information"
      : "Payouts paused"

  const steps: TimelineStep[] = [
    {
      title: "Payouts paused",
      detail: `${fmtDayShort(HOLD_STARTED)}, ${fmtTime(HOLD_STARTED)}`,
      state: "done",
    },
    ...(context
      ? [{ title: "You added context", detail: `${fmtDayShort(context.at)}, ${fmtTime(context.at)}`, state: "done" as const }]
      : []),
    ...(submission
      ? [{ title: "You sent details", detail: `${fmtDayShort(submission.at)}, ${fmtTime(submission.at)}`, state: "done" as const }]
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
          {needed
            ? "We need more information to finish our review."
            : `Your payouts are paused while we review recent activity on your account. We'll update you ${updateIn}.`}
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
          ) : needed ? (
            <>
              <div className="flex flex-col gap-5 py-6">
                <div className="flex flex-col gap-2 text-body-medium text-text-primary">
                  <p>
                    Your payouts are still on hold while we review recent activity on your
                    account. Please provide the information below.
                  </p>
                  <p>You&apos;ll receive an update within 24 hrs of receiving your response.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="hold-reason" className="text-body-medium text-text-primary">
                    What&apos;s changed in your business recently?
                  </Label>
                  <Textarea
                    id="hold-reason"
                    value={form.note}
                    disabled={sending}
                    onChange={(e) => setForm({ note: e.target.value })}
                    placeholder="For example, a promotion, a new product or a change in how you sell"
                    className="min-h-28"
                  />
                </div>
                <FileField label="Attachments" locked={sending} />
                {sendError && <SendError onDismiss={dismissSendError} />}
              </div>
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

              {/* Reply to an information request, read-only */}
              {submission && (
                <Section title="What you sent">
                  <div className="flex flex-col gap-2 bg-bg-subtle px-4 py-3 text-body-medium">
                    <p className="text-body-small text-text-secondary">
                      Sent {fmtDateTime(submission.at)}
                    </p>
                    <p className="break-words whitespace-pre-wrap text-text-primary">{submission.reason}</p>
                    {submission.files.length > 0 && (
                      <ul className="flex flex-col gap-2" aria-label="Files you sent">
                        {submission.files.map((f) => (
                          <FileRow key={f.id} file={f} readOnly />
                        ))}
                      </ul>
                    )}
                  </div>
                </Section>
              )}

              {/* 4. Optional context */}
              {(hold === "paused" || context) && (
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
              {needed ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={closeDrawer} disabled={sending}>
                    Cancel
                  </Button>
                  <Button
                    disabled={!canSend && !sending}
                    aria-busy={sending}
                    onClick={send}
                    leadingIcon={sending ? <Loader2 className="animate-spin" /> : undefined}
                  >
                    Submit
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={closeDrawer}>
                  Close
                </Button>
              )}
          </>
        </footer>
      </SheetContent>
    </Sheet>
  )
}
