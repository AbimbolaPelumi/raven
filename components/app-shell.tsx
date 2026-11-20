"use client"

import { Suspense, useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Banner } from "@/components/banner"
import { Header } from "@/components/header"
import { HoldDialog } from "@/components/hold-dialog"
import { Sidebar } from "@/components/sidebar"
import { derive } from "@/lib/proto"
import { useProto } from "@/lib/store"

/**
 * Chrome shared by every signed-in page: sidebar, header, the hold banner and
 * the review-details modal. Pages render only their own content as children, so
 * the banner and modal behave the same on Home, Payouts and anything added later.
 */
function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const holdParam = params.get("hold")
  const viewParam = params.get("view")

  const hold = useProto((s) => s.hold)
  const now = useProto((s) => s.now)
  const bannerDismissed = useProto((s) => s.bannerDismissed)
  const drawerOpen = useProto((s) => s.drawerOpen)
  const openDrawer = useProto((s) => s.openDrawer)
  const dismissBanner = useProto((s) => s.dismissBanner)

  const { banner } = useMemo(
    () => derive({ hold, now, bannerDismissed }),
    [hold, now, bannerDismissed]
  )

  // `?hold=open` (push notification, email, bell) opens the modal once state allows it.
  // `&view=form` goes straight to the information form (only in "info needed").
  useEffect(() => {
    if (holdParam === "open") openDrawer(viewParam === "form" ? "form" : "summary")
  }, [holdParam, viewParam, openDrawer])

  // Keep the URL honest: once the modal closes, drop the params (on whichever page we are).
  useEffect(() => {
    if (!drawerOpen && holdParam === "open" && hold !== "none") {
      router.replace(pathname, { scroll: false })
    }
  }, [drawerOpen, holdParam, hold, router, pathname])

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <Banner
          banner={banner}
          onAction={(a) =>
            a === "dismiss" ? dismissBanner() : openDrawer(a === "provide" ? "form" : "summary")
          }
        />
        <main className="flex flex-col gap-6 p-6">{children}</main>
      </div>
      <HoldDialog />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // useSearchParams needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
      <Shell>{children}</Shell>
    </Suspense>
  )
}
