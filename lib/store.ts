"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { toast } from "sonner"

import {
  ALERT,
  CLEARED_NOW,
  HOLD_HREF,
  HOLD_STARTED,
  MAX_FILE_BYTES,
  NEXT_DAY,
  NEXT_PAYOUT_DAY,
  RESET_NOW,
  addMinutes,
  UPDATE_WITHIN_HRS,
  fmtDate,
  isHeld,
  type AppNotification,
  type ContextNote,
  type Email,
  type HoldState,
  type PushNote,
  type Submission,
  type UploadFile,
} from "@/lib/proto"

/** "system" follows the OS setting and updates live. */
export type Theme = "light" | "dark" | "system"

export type DrawerView = "summary"

/**
 * One form, used by whichever is open: the optional "Expected this activity?"
 * context, or the reply to an information request. Only one can be open.
 */
export interface FormState {
  choice: string
  note: string
  files: UploadFile[]
}

export interface ProtoState {
  /** Simulated date and time, naive "YYYY-MM-DDTHH:mm". */
  now: string
  hold: HoldState
  drawerOpen: boolean
  drawerView: DrawerView
  form: FormState
  notifications: AppNotification[]
  emails: Email[]
  theme: Theme
  simulateUploadError: boolean
  simulateSendError: boolean

  submission: Submission | null
  context: ContextNote | null
  contextOpen: boolean
  resumedAt: string | null
  bannerDismissed: boolean
  sending: boolean
  sendError: boolean
  push: PushNote | null
  demoOpen: boolean
  alertsOpen: boolean
  hydrated: boolean

  // Demo controls
  placeHold: () => void
  clearHold: () => void
  /** Processor asks for more information (the exception, red). */
  requestInfo: () => void
  /** Moves the clock to the next morning with the hold still on. */
  nextDay: () => void
  reset: () => void
  setTheme: (t: Theme) => void
  setSimulateUploadError: (v: boolean) => void
  setSimulateSendError: (v: boolean) => void
  setDemoOpen: (v: boolean) => void
  setAlertsOpen: (v: boolean) => void

  // Product
  openDrawer: (view?: DrawerView) => void
  setDrawerView: (v: DrawerView) => void
  closeDrawer: () => void
  openContext: () => void
  cancelContext: () => void
  setForm: (patch: Partial<Omit<FormState, "files">>) => void
  addFiles: (files: File[]) => void
  removeFile: (id: string) => void
  retryFile: (id: string) => void
  /** Sends the optional context. Changes nothing about the hold. */
  sendContext: () => void
  /** Sends the reply to an information request. */
  send: () => void
  dismissBanner: () => void
  dismissSendError: () => void
  dismissPush: () => void
  markNotificationsRead: () => void
  markEmailRead: (id: string) => void
}

const INFO_BODY = "We need more information to finish our review."
const EMPTY_FORM: FormState = { choice: "", note: "", files: [] }
const ALLOWED = /\.(pdf|jpe?g|png)$/i
/**
 * The element that opened the drawer. The drawer is opened from the store
 * (banner, cards, rows, alerts, URL), not a Radix Trigger, so it records the
 * opener itself and focus goes back there on close.
 */
let opener: HTMLElement | null = null
export function takeOpener() {
  const el = opener
  opener = null
  return el
}

let seq = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`

/** What she already told us, as the starting text of an information reply. */
function contextAsReply(c: ContextNote) {
  return [c.choice + ".", c.note].filter((s) => s.trim()).join("\n")
}

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
        context: null,
        contextOpen: false,
        resumedAt: null,
        bannerDismissed: false,
        sending: false,
        sendError: false,
        push: null,
        demoOpen: false,
        alertsOpen: false,
        hydrated: false,

        placeHold: () => {
          const at = HOLD_STARTED
          set((s) => ({
            now: at,
            hold: "paused",
            bannerDismissed: false,
            submission: null,
            context: null,
            contextOpen: false,
            form: EMPTY_FORM,
            resumedAt: null,
            sendError: false,
            push: { id: uid("push"), title: ALERT.pushTitle, body: ALERT.pushBody, href: HOLD_HREF },
            notifications: [
              {
                id: uid("n"),
                title: ALERT.pushTitle,
                body: ALERT.pushBody,
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
                subject: ALERT.emailSubject,
                preview: ALERT.emailPreview,
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
            contextOpen: false,
            push: { id: uid("push"), title: "Payouts resumed", body, href: "/payouts" },
            notifications: [
              { id: uid("n"), title: "Payouts resumed", body, at, read: false, href: "/payouts" },
              ...s.notifications,
            ],
          }))
        },

        requestInfo: () => {
          const { hold, context, now } = get()
          if (hold !== "paused") return
          const at = addMinutes(now, 20)
          set((s) => ({
            now: at,
            hold: "info-needed",
            bannerDismissed: false,
            contextOpen: false,
            sendError: false,
            // If she already told us why, start the reply from that.
            form: context
              ? { ...EMPTY_FORM, note: contextAsReply(context), files: context.files }
              : { ...EMPTY_FORM, note: s.form.note, files: s.form.files },
            push: { id: uid("push"), title: "More information needed", body: INFO_BODY, href: HOLD_HREF },
            notifications: [
              {
                id: uid("n"),
                title: "More information needed",
                body: INFO_BODY,
                at,
                read: false,
                href: HOLD_HREF,
              },
              ...s.notifications,
            ],
            emails: [
              {
                id: "info-needed",
                from: "Raven",
                subject: "We need more information to finish our review",
                preview: "Tell us about the recent activity on your account",
                at,
                read: false,
              },
              ...s.emails.filter((e) => e.id !== "info-needed"),
            ],
          }))
        },

        nextDay: () => {
          const { hold, now } = get()
          if (isHeld(hold) && now < NEXT_DAY) set({ now: NEXT_DAY })
        },

        reset: () =>
          set({
            now: RESET_NOW,
            hold: "none",
            drawerOpen: false,
            drawerView: "summary",
            form: EMPTY_FORM,
            notifications: [],
            emails: [],
            submission: null,
            context: null,
            contextOpen: false,
            resumedAt: null,
            bannerDismissed: false,
            sending: false,
            sendError: false,
            push: null,
            alertsOpen: false,
          }),

        setTheme: (theme) => set({ theme }),
        setSimulateUploadError: (v) => set({ simulateUploadError: v }),
        setSimulateSendError: (v) => set({ simulateSendError: v }),
        setDemoOpen: (v) => set({ demoOpen: v }),
        setAlertsOpen: (v) => set({ alertsOpen: v }),

        openDrawer: (view = "summary") => {
          if (get().hold === "none") return
          if (!get().drawerOpen && typeof document !== "undefined") {
            const el = document.activeElement
            opener = el instanceof HTMLElement && el !== document.body ? el : null
          }
          set({ drawerOpen: true, drawerView: view })
        },
        setDrawerView: (drawerView) => set({ drawerView }),
        // Closing keeps whatever she typed; only the error goes away.
        closeDrawer: () => set({ drawerOpen: false, drawerView: "summary", sendError: false }),

        openContext: () => set({ contextOpen: true, sendError: false }),
        cancelContext: () => set({ contextOpen: false, sendError: false, form: EMPTY_FORM }),

        // Editing anything means the user is responding to the error: clear it.
        setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch }, sendError: false })),

        addFiles: (incoming) => {
          const added: UploadFile[] = incoming.map((f) => {
            const base = { id: uid("f"), name: f.name, size: f.size, progress: 0 }
            if (!ALLOWED.test(f.name)) {
              return { ...base, status: "error" as const, error: "Only PDF, JPG or PNG files.", retryable: false }
            }
            if (f.size > MAX_FILE_BYTES) {
              return { ...base, status: "error" as const, error: "This file is over 10MB.", retryable: false }
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

        sendContext: () => {
          const { form, sending, hold } = get()
          if (sending || hold !== "paused") return
          const busy = form.files.some((f) => f.status !== "done")
          if (!form.choice || busy) return
          set({ sending: true, sendError: false })
          setTimeout(() => {
            if (get().simulateSendError) {
              set({ sending: false, sendError: true })
              return
            }
            const s = get()
            const at = addMinutes(s.now, 6)
            set({
              sending: false,
              sendError: false,
              now: at,
              contextOpen: false,
              context: {
                choice: s.form.choice,
                note: s.form.note.trim(),
                files: s.form.files,
                at,
              },
              form: EMPTY_FORM,
            })
            toast.success("Sent. We've added this to your review.")
          }, 1400)
        },

        send: () => {
          const { form, sending, hold } = get()
          if (sending || hold !== "info-needed") return
          const busy = form.files.some((f) => f.status !== "done")
          if (!form.note.trim() || busy) return
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
              drawerView: "summary",
              bannerDismissed: false,
              submission: { reason: s.form.note.trim(), files: s.form.files, at },
              form: EMPTY_FORM,
            })
            toast.success(`Details received. We'll update you within ${UPDATE_WITHIN_HRS} hrs.`)
          }, 1400)
        },

        dismissBanner: () => set({ bannerDismissed: true }),
        dismissSendError: () => set({ sendError: false }),
        dismissPush: () => set({ push: null }),
        markNotificationsRead: () =>
          set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
        markEmailRead: (id) =>
          set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, read: true } : e)) })),
      }
    },
    {
      name: "raven-proto",
      // v2: new money model and context path. Older saved state is dropped.
      version: 2,
      migrate: () => ({}) as ProtoState,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Transient UI (push toast, sending spinner, panels) is not kept.
      partialize: (s) => ({
        now: s.now,
        hold: s.hold,
        drawerOpen: s.drawerOpen,
        form: {
          ...s.form,
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
        context: s.context,
        contextOpen: s.contextOpen,
        resumedAt: s.resumedAt,
        bannerDismissed: s.bannerDismissed,
      }),
      onRehydrateStorage: () => () => {
        useProto.setState({ hydrated: true })
      },
    }
  )
)
