import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-body-medium-strong transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-bg-inverse text-text-inverse hover:bg-bg-inverse/90 disabled:bg-bg-muted disabled:text-text-disabled",
        outline:
          "border border-border-default bg-bg-default text-text-primary hover:bg-bg-subtle disabled:text-text-disabled",
        ghost:
          "bg-transparent text-text-primary hover:bg-bg-subtle disabled:text-text-disabled",
      },
      size: {
        md: "h-9 px-3.5",
        sm: "h-8 px-3",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    leadingIcon?: React.ReactNode
    trailingIcon?: React.ReactNode
  }

function Button({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  // Slot requires exactly one child, so icons only apply to the plain button.
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
