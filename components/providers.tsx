"use client"

import { useEffect } from "react"

import { AlertsPreview } from "@/components/alerts-preview"
import { DemoControls } from "@/components/demo-controls"
import { PushNotification } from "@/components/push-notification"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useProto } from "@/lib/store"

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useProto((s) => s.hydrated)
  const theme = useProto((s) => s.theme)

  // Restore persisted prototype state on the client (SSR renders the empty shell).
  useEffect(() => {
    void useProto.persist.rehydrate()
  }, [])

  // "system" tracks the OS preference live; light/dark are explicit overrides.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && mq.matches)
      )
    apply()
    if (theme !== "system") return
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [theme])

  if (!hydrated) return <div className="min-h-screen bg-bg-base" />

  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <PushNotification />
      <DemoControls />
      <AlertsPreview />
      <Toaster />
    </TooltipProvider>
  )
}
