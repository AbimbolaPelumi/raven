"use client"

import { useEffect, useRef } from "react"
import { CircleAlert, Loader2 } from "lucide-react"

import { FileField, FileRow } from "@/components/file-upload"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CONTEXT_CHOICES, fmtDateTime, type ContextNote } from "@/lib/proto"
import { useProto } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Read-only record of what she told us. Also used after an information reply. */
export function ContextSummary({ context }: { context: ContextNote }) {
  return (
    <div className="flex flex-col gap-2 bg-bg-subtle px-4 py-3 text-body-medium">
      <p className="text-text-primary">
        You told us: <span className="text-body-medium-strong">{context.choice}</span>
      </p>
      <p className="text-body-small text-text-secondary">Sent {fmtDateTime(context.at)}</p>
      {context.note && (
        <p className="break-words whitespace-pre-wrap text-text-primary">{context.note}</p>
      )}
      {context.files.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Files you sent">
          {context.files.map((f) => (
            <FileRow key={f.id} file={f} readOnly />
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * "Expected this activity?" The way to say "this hold is a mistake" without
 * disputing it. Optional; sending it changes nothing about her status.
 */
export function ContextSection() {
  const context = useProto((s) => s.context)
  const open = useProto((s) => s.contextOpen)
  const form = useProto((s) => s.form)
  const sending = useProto((s) => s.sending)
  const sendError = useProto((s) => s.sendError)
  const openContext = useProto((s) => s.openContext)
  const cancelContext = useProto((s) => s.cancelContext)
  const setForm = useProto((s) => s.setForm)
  const sendContext = useProto((s) => s.sendContext)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(open)

  // Expanding moves focus into the form; collapsing returns it to the trigger.
  useEffect(() => {
    if (open && !wasOpen.current) {
      const first = document.querySelector<HTMLInputElement>('input[name="context-choice"]')
      first?.focus()
    }
    if (!open && wasOpen.current && !context) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open, context])

  const busy = form.files.some((f) => f.status !== "done")
  const canSend = Boolean(form.choice) && !busy && !sending

  return (
    <section aria-labelledby="context-heading" className="flex flex-col gap-3">
      <h3 id="context-heading" className="text-heading-small text-text-primary">
        Expected this activity?
      </h3>

      {context ? (
        <ContextSummary context={context} />
      ) : !open ? (
        <>
          <p className="text-body-medium text-text-secondary">
            If something recent explains the activity on your account, you can tell us.
          </p>
          <Button ref={triggerRef} variant="outline" className="w-fit" onClick={openContext}>
            Tell us what happened
          </Button>
        </>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSend) sendContext()
          }}
        >
          <p className="text-body-medium text-text-secondary">
            If something recent explains the activity on your account, you can tell us.
          </p>

          <fieldset className="flex flex-col gap-2" disabled={sending}>
            <legend className="mb-2 text-body-medium text-text-primary">
              What might explain it?
            </legend>
            {CONTEXT_CHOICES.map((c) => {
              const checked = form.choice === c
              return (
                <label
                  key={c}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-body-medium text-text-primary transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-text-primary",
                    checked ? "border-text-primary bg-bg-subtle" : "border-border-default hover:bg-bg-subtle"
                  )}
                >
                  <input
                    type="radio"
                    name="context-choice"
                    value={c}
                    checked={checked}
                    required
                    onChange={() => setForm({ choice: c })}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      checked ? "border-text-primary" : "border-border-strong"
                    )}
                  >
                    {checked && <span className="size-2 rounded-full bg-text-primary" />}
                  </span>
                  {c}
                </label>
              )
            })}
          </fieldset>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between text-body-medium">
              <Label htmlFor="context-note" className="text-body-medium text-text-primary">
                Anything else we should know?
              </Label>
              <span className="text-text-tertiary">Optional</span>
            </div>
            <Textarea
              id="context-note"
              value={form.note}
              disabled={sending}
              onChange={(e) => setForm({ note: e.target.value })}
              placeholder="Anything that gives us context"
              className="min-h-24"
            />
          </div>

          <FileField label="Attachments" locked={sending} />

          {sendError && (
            <p
              role="alert"
              className="flex items-start gap-2 bg-danger-bg px-3 py-2.5 text-body-medium text-danger-text"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-icon-danger" strokeWidth={1.75} aria-hidden />
              Couldn&apos;t send. Try again.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancelContext} disabled={sending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSend && !sending}
              aria-busy={sending}
              leadingIcon={sending ? <Loader2 className="animate-spin" /> : undefined}
            >
              Submit
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
