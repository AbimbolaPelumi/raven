"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Inbox as InboxIcon } from "lucide-react"

import { holdEmailHtml } from "@/lib/email"
import { fmtDate, fmtTime } from "@/lib/proto"
import { useProto } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Minimal made-up mail view. Deliberately not modelled on any real mail client. */
function MailFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-subtle">
      <header className="border-b border-border-default bg-bg-base">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/inbox"
            className="flex items-center gap-2 text-body-medium-strong text-text-primary"
          >
            <InboxIcon className="size-4 text-icon-primary" strokeWidth={1.75} aria-hidden />
            Inbox
          </Link>
          <Link
            href="/payouts"
            className="text-body-medium text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
          >
            Back to Raven
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-0 py-0 sm:px-4 sm:py-6">{children}</main>
    </div>
  )
}

export function InboxList() {
  const emails = useProto((s) => s.emails)

  return (
    <MailFrame>
      <div className="border-border-default bg-bg-base sm:border">
        <h1 className="border-b border-border-default px-4 py-3 text-heading-small text-text-primary">
          Inbox
        </h1>
        {emails.length === 0 ? (
          <p className="px-4 py-16 text-center text-body-medium text-text-secondary">
            Nothing here yet.
          </p>
        ) : (
          <ul>
            {emails.map((e) => (
              <li key={e.id} className="border-b border-border-default last:border-b-0">
                <Link
                  href={`/inbox/${e.id}`}
                  className="flex flex-col gap-0.5 px-4 py-3 hover:bg-bg-subtle sm:flex-row sm:items-baseline sm:gap-4"
                >
                  <span
                    className={cn(
                      "w-28 shrink-0 text-body-medium text-text-primary",
                      !e.read && "font-medium"
                    )}
                  >
                    {e.from}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-body-medium">
                    <span className={cn("text-text-primary", !e.read && "font-medium")}>
                      {e.subject}
                    </span>
                    <span className="text-text-secondary"> · {e.preview}</span>
                  </span>
                  <span className="shrink-0 text-body-small text-text-tertiary">
                    {fmtTime(e.at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MailFrame>
  )
}

export function EmailView({ id }: { id: string }) {
  const router = useRouter()
  const email = useProto((s) => s.emails.find((e) => e.id === id))
  const markRead = useProto((s) => s.markEmailRead)

  useEffect(() => {
    if (email && !email.read) markRead(id)
  }, [email, id, markRead])

  if (!email) {
    return (
      <MailFrame>
        <div className="bg-bg-base px-4 py-16 text-center sm:border sm:border-border-default">
          <p className="text-body-medium text-text-secondary">This message isn&apos;t here.</p>
          <Link
            href="/inbox"
            className="mt-3 inline-flex items-center gap-1.5 text-body-medium text-text-primary underline underline-offset-2"
          >
            <ArrowLeft className="size-4 text-icon-secondary" strokeWidth={1.75} aria-hidden />
            Back to inbox
          </Link>
        </div>
      </MailFrame>
    )
  }

  return (
    <MailFrame>
      <article className="bg-bg-base sm:border sm:border-border-default">
        <div className="border-b border-border-default px-4 py-4">
          <Link
            href="/inbox"
            className="mb-3 inline-flex items-center gap-1.5 text-body-medium text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="size-4 text-icon-secondary" strokeWidth={1.75} aria-hidden />
            Inbox
          </Link>
          <h1 className="text-heading-large text-text-primary">{email.subject}</h1>
          <p className="mt-2 text-body-medium text-text-secondary">
            <span className="text-text-primary">{email.from}</span> to tolu.adeyemi@gmail.com ·{" "}
            {fmtDate(email.at)}, {fmtTime(email.at)}
          </p>
        </div>

        {/*
          Real email-safe HTML, our own fixed template. Emails stay black on white
          in both themes, like a real one would. The CTA is routed client-side so
          prototype state survives the click.
        */}
        <div
          className="bg-white"
          onClick={(e) => {
            const a = (e.target as HTMLElement).closest("a")
            if (!a) return
            e.preventDefault()
            if (a.dataset.internal) router.push(a.getAttribute("href") ?? "/payouts")
          }}
          dangerouslySetInnerHTML={{ __html: holdEmailHtml(id === "info-needed" ? "info-needed" : "hold-paused") }}
        />
      </article>
    </MailFrame>
  )
}
