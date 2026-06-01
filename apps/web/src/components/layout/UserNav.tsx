"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"

export function UserNav({ user }: { user: { name?: string | null; email?: string | null } }) {
  return (
    <header className="relative z-20 flex items-center justify-between border-b-[2px] border-rim/40 bg-panel/60 px-4 py-2 backdrop-blur">
      <nav className="flex items-center gap-3">
        <Link href="/" className="font-impact text-sm uppercase tracking-tight text-neon">TCG</Link>
        <Link href="/collection" className="font-impact text-xs uppercase text-text-muted transition-colors hover:text-neon">Collection</Link>
        <Link href="/decks" className="font-impact text-xs uppercase text-text-muted transition-colors hover:text-neon">Decks</Link>
      </nav>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-text-muted">{user.name ?? user.email}</span>
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="rounded-sm border-[2px] border-rim px-2 py-1 font-impact text-xs uppercase text-text-muted transition-all hover:border-life-red hover:text-life-red"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
