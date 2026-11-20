"use client"

import { CircleCheckIcon, InfoIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useProto } from "@/lib/store"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useProto((s) => s.theme)

  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" strokeWidth={1.75} />,
        info: <InfoIcon className="size-4" strokeWidth={1.75} />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-none !border !border-border-default !bg-bg-base !text-text-primary !shadow-lg !font-sans !text-body-medium",
        },
      }}
      style={
        {
          "--normal-bg": "var(--bg-base)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-default)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
