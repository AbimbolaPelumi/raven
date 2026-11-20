"use client"

import { useRouter } from "next/navigation"
import { ArrowUpRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { holdEmailHtml } from "@/lib/email"
import { ALERT, HOLD_HREF, HOLD_STARTED, fmtDate, fmtTime } from "@/lib/proto"
import { useProto } from "@/lib/store"

function Column({
  title,
  caption,
  onOpen,
  children,
}: {
  title: string
  caption: string
  onOpen: () => void
  children: React.ReactNode
}) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-3">
      <div>
        <h3 className="text-heading-small text-text-primary">{title}</h3>
        <p className="text-body-small text-text-secondary">{caption}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <Button
        variant="outline"
        className="w-full"
        onClick={onOpen}
        trailingIcon={<ArrowUpRight className="text-icon-primary" strokeWidth={1.75} />}
        aria-label={`Open ${title.toLowerCase()} link`}
      >
        Open
      </Button>
    </section>
  )
}

/**
 * Presenter view of the three alerts Tolu gets when the hold is placed, as she
 * would see them. Each "Open" goes where tapping the real alert would:
 * /payouts?hold=open (banner + drawer open). Made-up chrome, no real OS look.
 */
export function AlertsPreview() {
  const open = useProto((s) => s.alertsOpen)
  const setOpen = useProto((s) => s.setAlertsOpen)
  const openDrawer = useProto((s) => s.openDrawer)
  const dismissPush = useProto((s) => s.dismissPush)
  const router = useRouter()

  const go = () => {
    setOpen(false)
    dismissPush()
    router.push(HOLD_HREF)
    // Also open directly: if we're already on this URL the param won't change.
    openDrawer()
  }

  const at = HOLD_STARTED

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        data-proto-overlay
        className="max-md:inset-0 max-md:top-0 max-md:left-0 max-md:h-full max-md:max-h-none max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:border-0 md:max-w-[1040px]"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-default px-4 py-4 md:px-6">
          <div>
            <DialogTitle className="text-heading-medium">Alerts Tolu receives</DialogTitle>
            <DialogDescription className="text-body-medium text-text-secondary">
              Sent when the hold is placed. Lock screens show them, so there is no amount.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close" className="-mr-2">
            <X className="size-5 text-icon-primary" strokeWidth={1.75} />
          </Button>
        </header>

        <div className="grid min-h-0 flex-1 gap-8 overflow-y-auto px-4 py-6 md:grid-cols-3 md:gap-6 md:px-6">
          {/* Push on a lock screen */}
          <Column title="Push notification" caption="Phone lock screen" onOpen={go}>
            <div className="mx-auto flex h-[420px] w-full max-w-[260px] flex-col items-center rounded-[36px] border-[6px] border-fill-inverse bg-bg-secondary px-3 pt-10">
              <p className="text-body-small text-text-secondary">{fmtDate(at).replace(/ \d{4}$/, "")}</p>
              <p className="font-serif text-[52px] leading-none text-text-primary">
                {fmtTime(at).replace(/[ap]m$/, "")}
              </p>
              <div className="mt-8 w-full rounded-2xl bg-bg-base/90 p-3 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="flex size-5 items-center justify-center rounded-[5px] bg-fill-inverse text-[10px] font-medium text-text-inverse"
                  >
                    R
                  </span>
                  <span className="flex-1 text-body-small text-text-secondary">Raven</span>
                  <span className="text-body-small text-text-tertiary">now</span>
                </div>
                <p className="mt-1.5 text-body-small-strong text-text-primary">{ALERT.pushTitle}</p>
                <p className="text-body-small text-text-primary">{ALERT.pushBody}</p>
              </div>
            </div>
          </Column>

          {/* SMS thread */}
          <Column title="SMS" caption="Messages thread" onOpen={go}>
            <div className="mx-auto flex h-[420px] w-full max-w-[260px] flex-col rounded-[36px] border-[6px] border-fill-inverse bg-bg-base">
              <div className="flex flex-col items-center gap-1 border-b border-border-default pt-5 pb-3">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-bg-secondary text-body-small-strong text-text-primary"
                >
                  R
                </span>
                <span className="text-body-small text-text-primary">Raven</span>
              </div>
              <div className="flex flex-1 flex-col justify-end gap-1 px-3 pb-6">
                <p className="text-center text-label-xsmall-strong text-text-tertiary">
                  {fmtDate(at).replace(/ \d{4}$/, "")}, {fmtTime(at)}
                </p>
                <p className="mr-6 rounded-2xl rounded-bl-sm bg-bg-muted px-3 py-2 text-body-small text-text-primary">
                  {ALERT.sms}
                </p>
              </div>
            </div>
          </Column>

          {/* Email */}
          <Column title="Email" caption={`Subject: ${ALERT.emailSubject}`} onOpen={go}>
            <div className="flex h-[420px] flex-col border border-border-default">
              <div className="shrink-0 border-b border-border-default bg-bg-base px-3 py-2.5 text-body-small">
                <p className="text-body-small-strong text-text-primary">{ALERT.emailSubject}</p>
                <p className="text-text-secondary">From Raven · {fmtTime(at)}</p>
              </div>
              {/* Emails stay black on white in both themes, like a real one. */}
              <div
                className="min-h-0 flex-1 overflow-y-auto bg-white"
                onClick={(e) => {
                  const a = (e.target as HTMLElement).closest("a")
                  if (!a) return
                  e.preventDefault()
                  if (a.dataset.internal) go()
                }}
                dangerouslySetInnerHTML={{ __html: holdEmailHtml("hold-paused") }}
              />
            </div>
          </Column>
        </div>
      </DialogContent>
    </Dialog>
  )
}
