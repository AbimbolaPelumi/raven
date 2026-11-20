"use client"

import { useEffect } from "react"
import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TWO_DAYS_LATER, fmtDateTime } from "@/lib/proto"
import { useProto } from "@/lib/store"

function isEditable(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-3 py-1.5 text-left text-body-medium text-text-primary"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-primary" : "bg-bg-secondary"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-bg-base transition-transform",
            checked && "translate-x-4"
          )}
        />
      </span>
    </button>
  )
}

/** Floating presenter panel. Hidden by default, toggled with Shift + D. */
export function DemoControls() {
  const s = useProto()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key !== "D" || isEditable(e.target)) return
      e.preventDefault()
      useProto.getState().setDemoOpen(!useProto.getState().demoOpen)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!s.demoOpen) return null

  return (
    <aside
      data-proto-overlay
      aria-label="Demo controls"
      className="pointer-events-auto fixed bottom-4 left-4 z-[90] w-[280px] border border-border-strong bg-bg-base p-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-body-medium-strong text-text-primary">Demo controls</h2>
        <span className="text-body-small text-text-tertiary">Shift + D</span>
      </div>
      <p className="mt-1 text-body-small text-text-secondary">
        Now: {fmtDateTime(s.now)} · Hold: {s.hold}
      </p>

      <p className="mt-3 text-body-small-strong text-text-secondary">Processor</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <Button size="sm" disabled={s.hold !== "none"} onClick={s.placeHold}>
          Place hold
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={s.hold === "none" || s.hold === "resumed"}
          onClick={s.clearHold}
        >
          Clear hold
        </Button>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-2 w-full"
        disabled={s.hold !== "paused"}
        onClick={s.requestInfo}
      >
        Request information
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="mt-2 w-full"
        disabled={s.hold !== "reviewing"}
        onClick={s.continueRestriction}
      >
        Continue restriction
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="mt-2 w-full"
        disabled={
          (s.hold !== "paused" && s.hold !== "info-needed" && s.hold !== "reviewing") ||
          s.now >= TWO_DAYS_LATER
        }
        onClick={s.passTwoDays}
      >
        Pass 2 days
      </Button>

      <div className="mt-3 border-t border-border-default pt-2">
        <div className="flex items-center justify-between gap-3 py-1.5">
          <span id="theme-label" className="text-body-medium text-text-primary">
            Theme
          </span>
          <div
            role="radiogroup"
            aria-labelledby="theme-label"
            className="flex border border-border-default"
          >
            {(["system", "light", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={s.theme === t}
                onClick={() => s.setTheme(t)}
                className={cn(
                  "cursor-pointer px-2.5 py-1 text-body-small capitalize transition-colors",
                  s.theme === t
                    ? "bg-brand-primary text-brand-on"
                    : "text-text-secondary hover:bg-bg-subtle"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Switch
          label="Simulate upload failure"
          checked={s.simulateUploadError}
          onChange={s.setSimulateUploadError}
        />
        <Switch
          label="Simulate submit failure"
          checked={s.simulateSendError}
          onChange={s.setSimulateSendError}
        />
      </div>

      <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={s.reset}>
        <RotateCcw />
        Reset
      </Button>
    </aside>
  )
}
