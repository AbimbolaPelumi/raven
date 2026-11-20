"use client"

import { useRouter } from "next/navigation"
import { Bell, Monitor, Moon, Search, Sun } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { fmtDate, fmtTime } from "@/lib/proto"
import { useProto, type Theme } from "@/lib/store"

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
]

function ThemeSwitcher() {
  const theme = useProto((s) => s.theme)
  const setTheme = useProto((s) => s.setTheme)
  const Current = THEMES.find((t) => t.value === theme)?.icon ?? Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Theme: ${theme}`}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border-default text-text-primary hover:bg-bg-subtle"
        >
          <Current className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          {THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="cursor-pointer">
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  const router = useRouter()
  const notifications = useProto((s) => s.notifications)
  const markRead = useProto((s) => s.markNotificationsRead)
  const unread = notifications.some((n) => !n.read)

  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-border-default bg-bg-base px-6">
      <label className="flex items-center gap-3 text-text-secondary">
        <Search className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="sr-only">Search</span>
        <input
          type="search"
          placeholder="Find anything..."
          className="w-64 bg-transparent text-body-medium text-text-primary outline-none placeholder:text-text-secondary"
        />
      </label>

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <DropdownMenu onOpenChange={(open) => open && markRead()}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={unread ? "Notifications, unread" : "Notifications"}
              className="relative flex size-8 cursor-pointer items-center justify-center rounded-full border border-border-default text-text-primary hover:bg-bg-subtle"
            >
              <Bell className="size-4" strokeWidth={1.75} aria-hidden />
              {unread && (
                <span
                  aria-hidden
                  className="absolute top-0 right-0 size-2 rounded-full bg-hold-dot ring-2 ring-bg-base"
                />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[340px]">
            <DropdownMenuLabel className="text-body-medium-strong">
              Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-body-medium text-text-secondary">
                {"You're all caught up."}
              </p>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onSelect={() => router.push(n.href)}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5"
                >
                  <span className="text-body-medium-strong text-text-primary">{n.title}</span>
                  <span className="text-body-medium text-text-secondary">{n.body}</span>
                  <span className="text-body-small text-text-tertiary">
                    {fmtDate(n.at)}, {fmtTime(n.at)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <span
          aria-label="Tolu Adeyemi"
          className="flex size-8 items-center justify-center rounded-full bg-bg-secondary text-body-small text-text-primary"
        >
          TA
        </span>
      </div>
    </header>
  )
}
