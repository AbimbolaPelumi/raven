"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { toast } from "sonner"

import {
  CLEARED_NOW,
  TWO_DAYS_LATER,
  HOLD_HREF,
  HOLD_STARTED,
  MAX_FILE_BYTES,
  NEXT_PAYOUT_DAY,
  RESET_NOW,
  addMinutes,
  fmtDate,
  type AppNotification,
  type Email,
  type HoldState,
  type PushNote,
  type Submission,
  type UploadFile,
} from "@/lib/proto"

/** "system" follows the OS setting and updates live. */
export type Theme = "light" | "dark" | "system"

export type DrawerView = "summary" | "form"

export interface ProtoState {
  /** Simulated date and time, naive "YYYY-MM-DDTHH:mm". */
  now: string
  hold: HoldState
  drawerOpen: boolean
  /** "form" is the information submission flow (only in Scenario 2). */
  drawerView: DrawerView
  form: { reason: string; files: UploadFile[] }
  notifications: AppNotification[]
  emails: Email[]
  theme: Theme
  simulateUploadError: boolean
  simulateSendError: boolean

  // Supporting state (not part of the core contract, but derived UI needs it)
  submission: Submission | null
  resumedAt: string | null
  bannerDismissed: boolean
  sending: boolean
  sendError: boolean
  push: PushNote | null
  demoOpen: boolean
  hydrated: boolean

  // Demo controls
  placeHold: () => void
  clearHold: () => void
  /** Processor: asks the merchant for more information (Scenario 1 -> 2). */
  requestInfo: () => void
  /** Processor: finishes the review but keeps payouts paused (back to the internal-review state). */
  continueRestriction: () => void
  passTwoDays: () => void
  reset: () => void
  setTheme: (t: Theme) => void
  setSimulateUploadError: (v: boolean) => void
  setSimulateSendError: (v: boolean) => void
  setDemoOpen: (v: boolean) => void

  // Product
  openDrawer: (view?: DrawerView) => void
  setDrawerView: (v: DrawerView) => void
  closeDrawer: () => void
  setReason: (v: string) => void
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  retryFile: (id: string) => void
  send: () => void
  dismissBanner: () => void
  dismissSendError: () => void
  dismissPush: () => void
  markNotificationsRead: () => void
  markEmailRead: (id: string) => void
}

const PAUSED_BODY =
  "We've temporarily paused your payouts while we review recent account activity."
const INFO_BODY = "We need some additional information to continue reviewing your payouts."
const INFO_HREF = `${HOLD_HREF}&view=form`

const EMPTY_FORM = { reason: "", files: [] as UploadFile[] }
const ALLOWED = /\.(pdf|jpe?g|png)$/i
let seq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`

export const useProto = create<ProtoState>()(
  persist(
    (set, get) => {
      /** Simulated upload: ticks progress, then resolves per the demo toggle. */
      const runUpload = (id: string) => {
        const patch = (p: Partial<UploadFile>) =>
          set((s) => ({
            form: {
              ...s.form,
              files: s.form.files.map((f) => (f.id === id ? { ...f, ...p } : f)),
            },
          }))
        patch({ status: "uploading", progress: 0, error: undefined })
        let progress = 0
        const timer = setInterval(() => {
          const file = get().form.files.find((f) => f.id === id)
          if (!file) return clearInterval(timer)
          progress = Math.min(100, progress + 10 + Math.round(Math.random() * 12))
          if (progress < 100) return patch({ progress })
          clearInterval(timer)
          if (get().simulateUploadError) {
            patch({
              status: "error",
              progress: 100,
              error: "Couldn't upload. Try again.",
              retryable: true,
            })
          } else {
            patch({ status: "done", progress: 100 })
          }
        }, 140)
      }

      return {
        now: RESET_NOW,
        hold: "none",
        drawerOpen: false,
        drawerView: "summary",
        form: EMPTY_FORM,
        notifications: [],
        emails: [],
        theme: "system",
        simulateUploadError: false,
        simulateSendError: false,
        submission: null,
        resumedAt: null,
        bannerDismissed: false,
        sending: false,
        sendError: false,
        push: null,
        demoOpen: false,
        hydrated: false,

        placeHold: () => {
          const at = HOLD_STARTED
          set((s) => ({
            now: at,
            hold: "paused",
            bannerDismissed: false,
            submission: null,
            resumedAt: null,
            sendError: false,
            push: {
              id: uid("push"),
              title: "Payouts paused",
              body: PAUSED_BODY,
              href: HOLD_HREF,
            },
            notifications: [
              {
                id: uid("n"),
                title: "Payouts paused",
                body: PAUSED_BODY,
                at,
                read: false,
                href: HOLD_HREF,
              },
              ...s.notifications,
            ],
            emails: [
              {
                id: "hold-paused",
                from: "Raven",
                subject: "Your payouts are paused",
                preview: "No action is needed right now",
                at,
                read: false,
              },
              ...s.emails.filter((e) => e.id !== "hold-paused" && e.id !== "info-needed"),
            ],
          }))
        },

        clearHold: () => {
          // Normally the reviewer clears it the next morning. If time has already
          // moved past that, clear shortly after "now" so the clock never goes back.
          const cur = get().now
          const at = cur < CLEARED_NOW ? CLEARED_NOW : addMinutes(cur, 45)
          const body = `Your next payout goes out on ${fmtDate(NEXT_PAYOUT_DAY)}.`
          set((s) => ({
            now: at,
            hold: "resumed",
            resumedAt: at,
            bannerDismissed: false,
            sending: false,
            sendError: false,
            push: { id: uid("push"), title: "Payouts resumed", body, href: "/payouts" },
            notifications: [
              {
                id: uid("n"),
                title: "Payouts resumed",
                body,
                at,
                read: false,
                href: "/payouts",
              },
              ...s.notifications,
            ],
          }))
        },

        requestInfo: () => {
          if (get().hold !== "paused") return
          const at = addMinutes(get().now, 20)
          set((s) => ({
            now: at,
            hold: "info-needed",
            bannerDismissed: false,
            push: { id: uid("push"), title: "Additional information needed", body: INFO_BODY, href: INFO_HREF },
            notifications: [
              {
                id: uid("n"),
                title: "Additional information needed",
                body: INFO_BODY,
                at,
                read: false,
                href: INFO_HREF,
              },
              ...s.notifications,
            ],
            emails: [
              {
                id: "info-needed",
                from: "Raven",
                subject: "We need additional information",
                preview: "Provide a few details so we can continue our review",
                at,
                read: false,
              },
              ...s.emails.filter((e) => e.id !== "info-needed"),
            ],
          }))
        },

        continueRestriction: () => {
          if (get().hold !== "reviewing") return
          // Review done, payouts stay paused: back to the processor-led state.
          set({ hold: "paused", submission: null, drawerOpen: false, drawerView: "summary" })
        },

        // Two days after the hold was placed, with the hold still in place.
        passTwoDays: () => {
          const { hold, now } = get()
          const held = hold === "paused" || hold === "info-needed" || hold === "reviewing"
          if (held && now < TWO_DAYS_LATER) set({ now: TWO_DAYS_LATER })
        },

        reset: () =>
          set({
            now: RESET_NOW,
            hold: "none",
            drawerOpen: false,
            form: { reason: "", files: [] },
            notifications: [],
            emails: [],
            submission: null,
            resumedAt: null,
            bannerDismissed: false,
            sending: false,
            sendError: false,
            push: null,
          }),

        setTheme: (theme) => set({ theme }),
        setSimulateUploadError: (v) => set({ simulateUploadError: v }),
        setSimulateSendError: (v) => set({ simulateSendError: v }),
        setDemoOpen: (v) => set({ demoOpen: v }),

        openDrawer: (view = "summary") => {
          if (get().hold !== "none") set({ drawerOpen: true, drawerView: view })
        },
        setDrawerView: (drawerView) => set({ drawerView }),
        closeDrawer: () => set({ drawerOpen: false, drawerView: "summary", sendError: false }),
        // Editing anything means the user is responding to the error: clear it.
        setReason: (reason) => set((s) => ({ form: { ...s.form, reason }, sendError: false })),

        addFiles: (incoming) => {
          const added: UploadFile[] = incoming.map((f) => {
            const base = { id: uid("f"), name: f.name, size: f.size, progress: 0 }
            if (!ALLOWED.test(f.name)) {
              return {
                ...base,
                status: "error" as const,
                error: "Only PDF, JPG or PNG files.",
                retryable: false,
              }
            }
            if (f.size > MAX_FILE_BYTES) {
              return {
                ...base,
                status: "error" as const,
                error: "This file is over 10MB.",
                retryable: false,
              }
            }
            return { ...base, status: "uploading" as const, retryable: true }
          })
          set((s) => ({ form: { ...s.form, files: [...s.form.files, ...added] }, sendError: false }))
          for (const f of added) if (f.status === "uploading") runUpload(f.id)
        },

        removeFile: (id) =>
          set((s) => ({
            form: { ...s.form, files: s.form.files.filter((f) => f.id !== id) },
            sendError: false,
          })),

        retryFile: (id) => runUpload(id),

        send: () => {
          const { form, sending, hold } = get()
          if (sending || hold !== "info-needed") return
          const busy = form.files.some((f) => f.status !== "done")
          if (!form.reason.trim() || busy) return
          set({ sending: true, sendError: false })
          setTimeout(() => {
            if (get().simulateSendError) {
              set({ sending: false, sendError: true })
              return
            }
            const s = get()
            const at = addMinutes(s.now, 8)
            set({
              sending: false,
              sendError: false,
              hold: "reviewing",
              now: at,
              drawerOpen: false,
              drawerView: "summary",
              bannerDismissed: false,
              submission: {
                reason: s.form.reason.trim(),
                files: s.form.files,
                at,
              },
              form: { reason: "", files: [] },
            })
            toast.success("Details submitted. We'll reply within one working day.")
          }, 1400)
        },

        dismissBanner: () => set({ bannerDismissed: true }),
        dismissSendError: () => set({ sendError: false }),
        dismissPush: () => set({ push: null }),
        markNotificationsRead: () =>
          set((s) => ({
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
          })),
        markEmailRead: (id) =>
          set((s) => ({
            emails: s.emails.map((e) => (e.id === id ? { ...e, read: true } : e)),
          })),
      }
    },
    {
      name: "raven-proto",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Transient UI (push toast, sending spinner, panel visibility) is not kept.
      partialize: (s) => ({
        now: s.now,
        hold: s.hold,
        drawerOpen: s.drawerOpen,
        form: {
          reason: s.form.reason,
          files: s.form.files.map((f) =>
            f.status === "uploading" ? { ...f, status: "done" as const, progress: 100 } : f
          ),
        },
        notifications: s.notifications,
        emails: s.emails,
        theme: s.theme,
        simulateUploadError: s.simulateUploadError,
        simulateSendError: s.simulateSendError,
        submission: s.submission,
        resumedAt: s.resumedAt,
        bannerDismissed: s.bannerDismissed,
      }),
      onRehydrateStorage: () => () => {
        useProto.setState({ hydrated: true })
      },
    }
  )
)
