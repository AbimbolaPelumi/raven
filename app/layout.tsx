import type { Metadata } from "next"
import { Hedvig_Letters_Serif, Instrument_Sans } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

// latin-ext carries U+20A6 (₦), which both faces need to render.
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
})

const hedvig = Hedvig_Letters_Serif({
  variable: "--font-hedvig",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Raven · Payouts",
  description: "Raven Payouts: hold prototype",
}

// Sets the theme class before first paint so dark mode doesn't flash.
const themeScript = `try{var s=JSON.parse(localStorage.getItem('raven-proto')||'{}');var t=(s.state&&s.state.theme)||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${hedvig.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
