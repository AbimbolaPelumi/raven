"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

/**
 * Side sheet on Radix Dialog: focus trap, Esc to close, focus returns to the
 * element that opened it.
 *  - right: 480px drawer from md up, full-screen sheet below 768px.
 *  - left:  navigation panel (mobile menu).
 * Header and footer are composed by the caller; the body scrolls between them.
 */
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "right" | "left" }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-bg-overlay/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col bg-bg-default shadow-[0_16px_48px_rgba(0,0,0,0.18)] transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:duration-300",
          side === "right" &&
            "inset-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:border-l md:border-border-default",
          side === "left" &&
            "inset-y-0 left-0 w-[280px] max-w-[calc(100%-48px)] border-r border-border-default data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          className
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-text-primary", className)} {...props} />
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-text-secondary", className)}
      {...props}
    />
  )
}

export { Sheet, SheetClose, SheetContent, SheetTitle, SheetDescription }
