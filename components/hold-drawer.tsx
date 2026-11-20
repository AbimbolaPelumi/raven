"use client"

import { useMemo, useState } from "react"
import { CircleAlert, CircleCheck, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { ContextSection } from "@/components/context-section"
import { FileField, FileRow } from "@/components/file-upload"
import { ReviewTimeline, type TimelineStep } from "@/components/review-timeline"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  HOLD_REF,
  HOLD_STARTED,
  NEXT_PAYOUT_DAY,
  UPDATE_BY,
  derive,
  fmtDate,
  fmtDateTime,
  fmtDayShort,
  fmtNaira,
  fmtTime,
} from "@/lib/proto"
import { takeOpener, useProto } from "@/lib/store"
import { cn } from "@/lib/utils"

const SUPPORT_TEXT = `Hi, I have a question about my payout review (reference ${HOLD_REF}).\n\n`

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
  const view = useProto((s) => s.drawerView)
  const form = useProto((s) => s.form)
  const sending = useProto((s) => s.sending)
  const sendError = useProto((s) => s.sendError)
  const submission = useProto((s) => s.submission)
  const context = useProto((s) => s.context)
  const resumedAt = useProto((s) => s.resumedAt)
  const closeDrawer = useProto((s) => s.closeDrawer)
  const setDrawerView = useProto((s) => s.setDrawerView)
  const dismissSendError = useProto((s) => s.dismissSendError)
  const setForm = useProto((s) => s.setForm)
  const send = useProto((s) => s.send)

  const [supportText, setSupportText] = useState(SUPPORT_TEXT)

  const vm = useMemo(() => derive({ hold, now, bannerDismissed }), [hold, now, bannerDismissed])

  const open = drawerOpen && hold !== "none"
  const needed = hold === "info-needed"
  const resumed = hold === "resumed"
  const support = view === "support"
  const updateBy = fmtDayShort(UPDATE_BY)

  const busy = form.files.some((f) => f.status !== "done")
  const canSend = needed && form.note.trim().length > 0 && !busy && !sending

  const title = support
    ? "Contact support"
    : resumed
      ? "Hold lifted"
      : needed
        ? "More information needed"
        : "Payouts under review"

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
    { title: "Under review", detail: "We're checking your recent activity", state: "current" },
    { title: "Next update", detail: `By ${updateBy}`, state: "upcoming" },
  ]

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) closeDrawer()
        else setSupportText(SUPPORT_TEXT)
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
            : `Your payouts are paused for review. We'll update you by ${updateBy}.`}
        </SheetDescription>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 md:px-6">
          {support ? (
            <div className="flex flex-col gap-2 py-6">
              <Label htmlFor="support-message" className="text-body-medium text-text-primary">
                Your message
              </Label>
              <Textarea
                id="support-message"
                value={supportText}
                onChange={(e) => setSupportText(e.target.value)}
                className="min-h-40"
              />
              <p className="text-body-small text-text-secondary">
                Your hold reference is included so support can find your review.
              </p>
            </div>
          ) : resumed ? (
            <>
              <div className="flex flex-col gap-1 pt-6 pb-6">
                <p className="text-heading-large text-text-primary">{fmtNaira(vm.balanceAmount)}</p>
                <p className="text-body-medium text-text-secondary">Payout scheduled</p>
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
              <div className="flex flex-col gap-4 py-6 text-body-medium">
                <div>
                  <h3 className="text-body-medium-strong text-text-primary">What we need</h3>
                  <p className="text-text-secondary">
                    Tell us what caused the recent increase in activity, and add anything that shows it.
                  </p>
                </div>
                <div>
                  <h3 className="text-body-medium-strong text-text-primary">Why</h3>
                  <p className="text-text-secondary">
                    This helps us confirm the increase came from real customers.
                  </p>
                </div>
                <div>
                  <h3 className="text-body-medium-strong text-text-primary">After you send it</h3>
                  <p className="text-text-secondary">
                    We&apos;ll update you within one working day of receiving it.
                  </p>
                </div>
              </div>
              <Section title="Your reply">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="hold-reason" className="text-body-medium text-text-primary">
                    What caused the increase?
                  </Label>
                  {context && (
                    <p id="hold-reason-hint" className="text-body-small text-text-secondary">
                      We&apos;ve added what you already told us. Edit it if you like.
                    </p>
                  )}
                  <Textarea
                    id="hold-reason"
                    aria-describedby={context ? "hold-reason-hint" : undefined}
                    value={form.note}
                    disabled={sending}
                    onChange={(e) => setForm({ note: e.target.value })}
                    placeholder="For example, a sale, a campaign or a large order"
                    className="min-h-28"
                  />
                </div>
                <FileField label="Supporting files" locked={sending} />
                {sendError && <SendError onDismiss={dismissSendError} />}
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
                  New sales are added to your balance and paid out after the review.
                </p>
              </div>

              {/* 2. Details */}
              <Section>
                <dl className="flex flex-col gap-3">
                  <DetailRow label="Paused since" value={fmtDateTime(HOLD_STARTED)} />
                  <DetailRow label="Reason" value="Unusual activity on your account" />
                  <DetailRow label="Action needed" value="None" />
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

              {/* 5. What happens next */}
              <Section title="What happens next">
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-medium text-text-secondary marker:text-text-tertiary">
                  <li>You can keep accepting payments as usual.</li>
                  <li>We&apos;ll update you by {updateBy}, even if we&apos;re still reviewing.</li>
                  <li>If we need anything from you, we&apos;ll ask.</li>
                  <li>No update by then? Contact support and we&apos;ll prioritise your review.</li>
                </ul>
              </Section>
            </>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border-default px-4 py-4 md:px-6">
          {support ? (
            <>
              <Button variant="ghost" onClick={() => setDrawerView("summary")}>
                Back
              </Button>
              <Button
                disabled={!supportText.trim()}
                onClick={() => {
                  toast.success("Message sent. We'll reply by email.")
                  setSupportText(SUPPORT_TEXT)
                  setDrawerView("summary")
                }}
              >
                Send message
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="-ml-2" onClick={() => setDrawerView("support")}>
                Contact support
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
          )}
        </footer>
      </SheetContent>
    </Sheet>
  )
}
