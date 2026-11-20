"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

/**
 * Small round copy button that appears when its parent (`group/copy`) is
 * hovered, or when it has keyboard focus. Always visible on touch screens,
 * which have no hover. Icon crossfades to a check for a moment after copying.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        void navigator.clipboard?.writeText(value)
        toast.success("Reference copied")
        setCopied(true)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 1500)
      }}
      className={cn(
        "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-default bg-bg-base text-icon-primary",
        // Reveal: fast ease-out fade. Press: subtle scale for feedback.
        "opacity-0 transition-[opacity,transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "group-hover/copy:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
        "hover:bg-bg-subtle active:scale-[0.97]"
      )}
    >
      {/* Crossfade with a touch of blur so the swap reads as one change. */}
      <Copy
        aria-hidden
        strokeWidth={1.75}
        className={cn(
          "absolute size-3.5 transition-[opacity,filter,transform] duration-200 ease-out",
          copied ? "scale-75 opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-0"
        )}
      />
      <Check
        aria-hidden
        strokeWidth={2}
        className={cn(
          "absolute size-3.5 text-icon-success transition-[opacity,filter,transform] duration-200 ease-out",
          copied ? "scale-100 opacity-100 blur-0" : "scale-75 opacity-0 blur-[2px]"
        )}
      />
    </button>
  )
}
