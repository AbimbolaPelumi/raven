"use client"

import { useMemo, useRef, useState } from "react"
import { CircleAlert, CircleCheck, FileText, Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  NEXT_PAYOUT_DAY,
  derive,
  fmtBytes,
  fmtDate,
  fmtDateTime,
  fmtNaira,
  type UploadFile,
} from "@/lib/proto"
import { useProto } from "@/lib/store"
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
    <section className={cn("flex flex-col gap-2.5 border-t border-border-default py-6", className)}>
      {title && <h3 className="text-heading-small text-text-primary">{title}</h3>}
      {children}
    </section>
  )
}

function FileRow({
  file,
  locked,
  readOnly,
}: {
  file: UploadFile
  locked?: boolean
  readOnly?: boolean
}) {
  const removeFile = useProto((s) => s.removeFile)
  const retryFile = useProto((s) => s.retryFile)
  const failed = file.status === "error"

  return (
    <li
      className={cn(
        "flex flex-col gap-2 border px-3 py-2.5",
        failed ? "border-danger-dot bg-danger-bg" : "border-border-default bg-bg-base"
      )}
    >
      <div className="flex items-center gap-2.5">
        <FileText
          className={cn("size-4 shrink-0", failed ? "text-danger-text" : "text-text-secondary")}
          strokeWidth={1.75}
          aria-hidden
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-body-medium",
            failed ? "text-danger-text" : "text-text-primary"
          )}
        >
          {file.name}
        </span>
        <span className="shrink-0 text-body-small text-text-tertiary">{fmtBytes(file.size)}</span>
        {!readOnly && (
          <button
            type="button"
            disabled={locked}
            onClick={() => removeFile(file.id)}
            aria-label={`Remove ${file.name}`}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {file.status === "uploading" && (
        <div
          role="progressbar"
          aria-label={`Uploading ${file.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={file.progress}
          className="h-1 w-full bg-bg-secondary"
        >
          <div
            className="h-full bg-brand-primary transition-[width] duration-150"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}

      {failed && (
        <div className="flex items-center justify-between gap-3 text-body-small text-danger-text">
          <span role="alert">{file.error}</span>
          {file.retryable && !locked && (
            <button
              type="button"
              onClick={() => retryFile(file.id)}
              className="cursor-pointer text-body-small-strong underline underline-offset-2 hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </li>
  )
}

function DropZone({ locked }: { locked: boolean }) {
  const addFiles = useProto((s) => s.addFiles)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = () => inputRef.current?.click()

  return (
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-disabled={locked}
      aria-label="Supporting files. Drop files here or browse. PDF, JPG or PNG, up to 10MB each"
      onClick={locked ? undefined : pick}
      onKeyDown={(e) => {
        if (locked) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          pick()
        }
      }}
      onDragOver={(e) => {
        if (locked) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!locked) addFiles(Array.from(e.dataTransfer.files))
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 border border-dashed py-7 transition-colors",
        dragging
          ? "border-text-primary bg-bg-muted"
          : "border-border-strong bg-bg-subtle hover:bg-bg-muted",
        locked && "pointer-events-none opacity-60"
      )}
    >
      <Upload className="size-5 text-text-secondary" strokeWidth={1.75} aria-hidden />
      <p className="text-body-medium text-text-primary">
        Drop files here or <span className="text-brand-text underline underline-offset-2">browse</span>
      </p>
      <p className="text-body-small text-text-tertiary">PDF, JPG or PNG, up to 10MB each</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []))
          e.target.value = ""
        }}
      />
    </div>
  )
}

export function HoldDialog() {
  const hold = useProto((s) => s.hold)
  const now = useProto((s) => s.now)
  const bannerDismissed = useProto((s) => s.bannerDismissed)
  const drawerOpen = useProto((s) => s.drawerOpen)
  const drawerView = useProto((s) => s.drawerView)
  const form = useProto((s) => s.form)
  const sending = useProto((s) => s.sending)
  const sendError = useProto((s) => s.sendError)
  const submission = useProto((s) => s.submission)
  const resumedAt = useProto((s) => s.resumedAt)
  const closeDrawer = useProto((s) => s.closeDrawer)
  const dismissSendError = useProto((s) => s.dismissSendError)
  const setDrawerView = useProto((s) => s.setDrawerView)
  const setReason = useProto((s) => s.setReason)
  const send = useProto((s) => s.send)

  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const { balanceAmount } = useMemo(
    () => derive({ hold, now, bannerDismissed }),
    [hold, now, bannerDismissed]
  )

  const open = drawerOpen && hold !== "none"
  const underReview = hold === "paused"
  const needed = hold === "info-needed"
  const reviewing = hold === "reviewing"
  const resumed = hold === "resumed"
  // The information form only exists while the processor is asking for it.
  const showForm = needed && drawerView === "form"

  const busy = form.files.some((f) => f.status !== "done")
  const canSend = showForm && form.reason.trim().length > 0 && !busy

  const title = resumed
    ? "Hold lifted"
    : needed
      ? "Additional information required"
      : "Your payouts are paused"

  const description = resumed
    ? "This hold on your payouts has been lifted."
    : needed
      ? "We need a little more information to complete our review of your recent account activity."
      : underReview
        ? "While we review recent activity on your account, your payouts are temporarily paused. You can keep accepting payments as usual, and we'll contact you if we need any additional information."
        : "We're reviewing the details you submitted."

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDrawer()}>
      <DialogContent
        className="gap-0 p-0"
        onOpenAutoFocus={(e) => {
          if (!showForm) return
          e.preventDefault()
          reasonRef.current?.focus()
        }}
        // The demo panel and push card live outside the modal on purpose.
        onInteractOutside={(e) => {
          const t = e.target as HTMLElement | null
          if (t?.closest("[data-proto-overlay]")) e.preventDefault()
        }}
      >
        <DialogHeader className="border-b border-border-default px-6 py-4">
          <DialogTitle className="text-heading-medium text-text-primary">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            aria-label="Close"
            className="-mr-2"
          >
            <X className="size-5" strokeWidth={1.75} />
          </Button>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {resumed ? (
            <>
              <div className="flex flex-col gap-1 pt-5 pb-6">
                <p className="text-heading-large text-text-primary">{fmtNaira(balanceAmount)}</p>
                <p className="text-body-small text-text-secondary">Payout scheduled</p>
              </div>
              <Section>
                <dl className="flex flex-col gap-4">
                  <DetailRow label="Hold lifted" value={fmtDate(resumedAt ?? now)} />
                  <DetailRow label="Next payout" value={fmtDate(NEXT_PAYOUT_DAY)} />
                </dl>
              </Section>
              <Section>
                <div className="flex items-start gap-2.5 text-body-medium text-text-primary">
                  <CircleCheck
                    className="mt-0.5 size-4 shrink-0 text-success-text"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <p>Payouts are back on. You don&apos;t need to do anything else.</p>
                </div>
              </Section>
            </>
          ) : (
            <>
              <p className="pt-5 pb-5 text-body-medium text-text-primary">{description}</p>

              {/* Scenario 2, summary */}
              {needed && !showForm && (
                <Section title="Next step">
                  <p className="text-body-medium text-text-secondary">
                    Provide the requested details so we can continue reviewing your payouts.
                  </p>
                </Section>
              )}

              {/* Scenario 2, the existing information submission flow */}
              {showForm && (
                <div className="flex flex-col gap-5 pb-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hold-reason" className="text-body-medium text-text-primary">
                      What caused the change?
                    </Label>
                    <Textarea
                      id="hold-reason"
                      ref={reasonRef}
                      value={form.reason}
                      disabled={sending}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="For example, a sale, a campaign or a large order"
                      className="h-28"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between text-body-medium">
                      <span className="text-text-primary">Supporting files</span>
                      <span className="text-text-tertiary">Optional</span>
                    </div>
                    <DropZone locked={sending} />
                    {form.files.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-2" aria-label="Attached files">
                        {form.files.map((f) => (
                          <FileRow key={f.id} file={f} locked={sending} />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Review pending again after the merchant submitted */}
              {reviewing && submission && (
                <>
                  <Section title="Details you submitted">
                    <dl className="flex flex-col gap-4 pt-1">
                      <DetailRow label="Submitted" value={fmtDateTime(submission.at)} />
                    </dl>
                    <div className="mt-1">
                      <p className="text-body-small text-text-secondary">What caused the change?</p>
                      <p className="mt-1 bg-bg-subtle px-3 py-2.5 text-body-medium break-words whitespace-pre-wrap text-text-primary">
                        {submission.reason}
                      </p>
                    </div>
                    {submission.files.length > 0 && (
                      <div className="mt-1">
                        <p className="text-body-small text-text-secondary">Supporting files</p>
                        <ul className="mt-1 flex flex-col gap-2">
                          {submission.files.map((f) => (
                            <FileRow key={f.id} file={f} readOnly />
                          ))}
                        </ul>
                      </div>
                    )}
                  </Section>
                  <Section title="What happens next">
                    <p className="text-body-medium text-text-secondary">
                      We&apos;ll reply within one working day, including weekends.
                    </p>
                  </Section>
                </>
              )}

              <p className="pb-6 text-body-medium text-text-secondary">
                Questions?{" "}
                <button
                  type="button"
                  onClick={() => toast("Support isn't part of this prototype.")}
                  className="cursor-pointer text-brand-text underline underline-offset-2 hover:no-underline"
                >
                  Contact support
                </button>
              </p>
            </>
          )}
        </div>

        {sendError && showForm && (
          <div
            role="alert"
            className="mx-6 mb-3 flex items-start gap-2 bg-danger-bg px-3 py-2.5 text-body-medium text-danger-text"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="flex-1">We couldn&apos;t submit your details. Try again.</span>
            <button
              type="button"
              onClick={dismissSendError}
              aria-label="Dismiss error"
              className="flex size-5 shrink-0 cursor-pointer items-center justify-center hover:opacity-70"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        )}

        <DialogFooter className="border-t border-border-default px-6 py-4">
          {showForm ? (
            <>
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
            </>
          ) : (
            <>
              <Button variant="outline" onClick={closeDrawer}>
                Close
              </Button>
              {needed && <Button onClick={() => setDrawerView("form")}>Provide information</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
