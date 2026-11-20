import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full resize-none border border-border-default bg-bg-base px-3 py-2.5 text-body-medium text-text-primary transition-colors outline-none placeholder:text-text-tertiary hover:border-border-strong focus-visible:border-text-primary disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-secondary",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
