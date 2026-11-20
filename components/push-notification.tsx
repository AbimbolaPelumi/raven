"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { useProto } from "@/lib/store"

/**
 * In-app system notification, top right. Styled like a desktop notification
 * without borrowing any real OS or brand look. Click goes to /payouts?hold=open (banner + drawer).
 */
export function PushNotification() {
  const push = useProto((s) => s.push)
  const dismiss = useProto((s) => s.dismissPush)
  const router = useRouter()

  useEffect(() => {
    if (!push) return
    const t = setTimeout(dismiss, 10_000)
    return () => clearTimeout(t)
  }, [push, dismiss])

  if (!push) return null

  return (
    <div
      // Lets the open drawer's focus trap ignore interactions with this card.
      data-proto-overlay
      role="alert"
      className="group pointer-events-auto fixed top-4 right-4 z-[80] w-[360px] max-w-[calc(100vw-32px)] animate-[push-in_240ms_cubic-bezier(0.22,1,0.36,1)] border border-border-default bg-bg-default shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      <button
        type="button"
        onClick={() => {
          const href = push.href
          dismiss()
          router.push(href)
        }}
        className="flex w-full cursor-pointer items-start gap-3 p-4 pr-10 text-left"
      >
        <span
          aria-hidden
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-bg-inverse text-label-xsmall-strong text-text-inverse"
        >
          R
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-body-medium-strong text-text-primary">{push.title}</span>
            <span className="text-body-small text-text-tertiary">now</span>
          </span>
          <span className="mt-0.5 block text-body-medium text-text-secondary">{push.body}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 flex size-6 cursor-pointer items-center justify-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-text-primary focus-visible:opacity-100"
      >
        <X className="size-4 text-icon-tertiary" strokeWidth={1.75} />
      </button>
    </div>
  )
}
