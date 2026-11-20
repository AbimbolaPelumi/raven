"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowDownToLine,
  ChevronsUpDown,
  Code,
  CreditCard,
  House,
  Menu,
  RotateCcw,
  Settings,
  Shield,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: LucideIcon
  href?: string
}

const MAIN: NavItem[] = [
  { label: "Home", icon: House, href: "/" },
  { label: "Payments", icon: CreditCard },
  { label: "Payouts", icon: ArrowDownToLine, href: "/payouts" },
  { label: "Customers", icon: Users },
  { label: "Disputes", icon: Shield },
  { label: "Refunds", icon: RotateCcw },
]

const BOTTOM: NavItem[] = [
  { label: "Developers", icon: Code },
  { label: "Settings", icon: Settings },
]

/** `rail`: collapses to icons between 768 and 1279px. The mobile menu is always full. */
function NavLink({ item, active, rail }: { item: NavItem; active: boolean; rail: boolean }) {
  const Icon = item.icon
  const cls = cn(
    "flex h-10 w-full items-center gap-3.5 pl-4 text-left text-body-medium transition-colors",
    rail && "max-xl:justify-center max-xl:pl-0",
    active
      ? "bg-brand-subtle text-brand-text"
      : "text-text-head hover:bg-bg-subtle hover:text-text-primary"
  )
  const content = (
    <>
      <Icon
        className={cn("size-5 shrink-0", active ? "text-icon-primary" : "text-icon-secondary")}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className={cn(rail && "max-xl:sr-only")}>{item.label}</span>
    </>
  )

  if (item.href) {
    return (
      <Link href={item.href} aria-current={active ? "page" : undefined} className={cls}>
        {content}
      </Link>
    )
  }
  // Only Payouts exists in this prototype. The rest explain themselves on hover/focus.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-disabled="true" className={cn(cls, "cursor-default")}>
          {content}
        </button>
      </TooltipTrigger>
      <TooltipContent side={rail ? "right" : "bottom"}>Not part of this prototype</TooltipContent>
    </Tooltip>
  )
}

function BusinessSwitcher({ rail }: { rail: boolean }) {
  const r = (c: string) => (rail ? c : "")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full min-w-0 cursor-pointer items-center gap-2.5 py-1.5 pr-2 pl-3 text-left hover:bg-bg-subtle",
            r("max-xl:w-auto max-xl:p-1")
          )}
        >
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center bg-fill-inverse text-label-xsmall-strong text-text-inverse"
          >
            TA
          </span>
          <span className={cn("min-w-0 flex-1", r("max-xl:sr-only"))}>
            <span className="block truncate text-body-medium text-text-primary">Tolu Atelier</span>
            <span className="block truncate text-body-small text-text-tertiary">
              tolu.adeyemi@gmail.com
            </span>
          </span>
          <ChevronsUpDown
            className={cn("size-4 shrink-0 text-icon-secondary", r("max-xl:hidden"))}
            strokeWidth={1.75}
            aria-hidden
          />
          <span className="sr-only">Switch business</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-body-small text-text-tertiary">Businesses</DropdownMenuLabel>
        <DropdownMenuItem>Tolu Atelier</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Nav({ rail, onNavigate }: { rail: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 px-3 pt-3" onClick={onNavigate}>
        {MAIN.map((item) => (
          <NavLink key={item.label} item={item} active={item.href === pathname} rail={rail} />
        ))}
      </nav>
      <nav aria-label="Secondary" className="flex flex-col gap-0.5 px-3 pt-3 pb-4">
        {BOTTOM.map((item) => (
          <NavLink key={item.label} item={item} active={false} rail={rail} />
        ))}
      </nav>
    </>
  )
}

/** Desktop and tablet sidebar. Hidden below 768px, where the header menu opens `MobileNav`. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[70px] shrink-0 flex-col border-r border-border-default bg-bg-base max-md:hidden xl:w-60">
      <div className="flex h-[70px] items-center border-b border-border-default px-3 max-xl:justify-center max-xl:px-0">
        <BusinessSwitcher rail />
      </div>
      <Nav rail />
    </aside>
  )
}

/** Mobile navigation: the same items in a left sheet, opened from the header. */
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Close after navigating.
  useEffect(() => setOpen(false), [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-1 flex size-9 cursor-pointer items-center justify-center text-icon-primary hover:bg-bg-subtle md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
      <SheetContent side="left" aria-describedby={undefined}>
        <div className="flex h-[60px] shrink-0 items-center justify-between gap-2 border-b border-border-default pr-2 pl-1">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <BusinessSwitcher rail={false} />
          <SheetClose
            aria-label="Close menu"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center text-icon-primary hover:bg-bg-subtle"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </SheetClose>
        </div>
        <Nav rail={false} />
      </SheetContent>
    </Sheet>
  )
}
