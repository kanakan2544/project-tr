import Link from "next/link"
import { MatchLobby } from "@/components/lobby/MatchLobby"

export default function LobbyPage() {
  return (
    <main className="relative bg-void-glow flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-8">
      {/* Grid texture overlay */}
      <div className="tex-grid opacity-50" />

      {/* Decorative glow slash behind title */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[120px] w-[600px] -translate-x-1/2 -translate-y-1/2 -rotate-2 blur-none" style={{ transform: "translateX(-50%) translateY(-50%) rotate(-2deg)", background: "rgba(244,201,93,0.04)" }} />

      <div className="relative z-10 text-center">
        <h1 className="font-impact text-[80px] leading-none uppercase tracking-tight text-text-primary md:text-[100px]"
          style={{ textShadow: "0 0 20px rgba(244,201,93,0.5)" }}>
          TCG
        </h1>
        <h1 className="font-impact text-[80px] leading-none uppercase tracking-tight text-neon md:text-[100px]"
          style={{ textShadow: "0 0 30px rgba(244,201,93,0.8)" }}>
          ONLINE
        </h1>
        <div className="mx-auto mt-2 flex items-center gap-2">
          <div className="h-[2px] flex-1 bg-rim" />
          <span className="rounded-sm border-[2px] border-rim bg-panel px-3 py-0.5 font-impact text-xs uppercase tracking-tight text-neon">
            Nexus Academy Duels
          </span>
          <div className="h-[2px] flex-1 bg-rim" />
        </div>
      </div>
      <div className="relative z-10">
        <MatchLobby />
      </div>

      <div className="relative z-10 flex gap-3">
        <Link
          href="/editor"
          className="rounded-sm border-[2px] border-rim bg-panel px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-text-primary hover:bg-neon/20 hover:text-neon hover:border-neon shadow-panel-sm transition-all"
        >
          Card Editor
        </Link>
        <Link
          href="/debug"
          className="rounded-sm border-[2px] border-rim bg-panel px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-text-primary hover:bg-neon/20 hover:text-neon hover:border-neon shadow-panel-sm transition-all"
        >
          Debug Sandbox
        </Link>
      </div>
    </main>
  )
}
