import type { Metadata } from "next"
import { Cinzel, Nunito, JetBrains_Mono, Anton } from "next/font/google"
import { auth } from "@/auth"
import { Providers } from "@/components/auth/Providers"
import { UserNav } from "@/components/layout/UserNav"
import "./globals.css"

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-impact",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TCG Online",
  description: "Competitive tactical card game",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en" className={`${cinzel.variable} ${nunito.variable} ${jetbrainsMono.variable} ${anton.variable}`}>
      <body className="min-h-screen bg-void font-body text-text-primary antialiased">
        <Providers session={session}>
          {session?.user && <UserNav user={session.user} />}
          {children}
        </Providers>
      </body>
    </html>
  )
}
