"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { GameBoard } from "@/components/board/GameBoard"
import { useGameClient } from "@/hooks/useGameClient"

const STATUS_MESSAGES: Record<string, string> = {
  connecting: "Connecting to server...",
  reconnecting: "Reconnecting...",
  waiting: "Waiting for opponent...",
  opponent_disconnected: "Opponent disconnected — waiting for reconnect (30s)...",
}

export default function GamePage() {
  const params = useParams()
  const roomId = params["roomId"] as string
  const { gameState, sendAction, status, playerId, lastError, latestBatch } = useGameClient(roomId)

  if (status === "opponent_timeout") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-parchment">
        <p className="font-body text-warm-muted">Opponent timed out.</p>
        <Link href="/" className="font-body text-sm text-gold transition-colors hover:text-gold-light">
          ← Back to lobby
        </Link>
      </div>
    )
  }

  if (status === "disconnected") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-parchment">
        <p className="font-body text-warm-muted">Connection lost.</p>
        {lastError && (
          <p className="font-body text-xs text-life-red">{lastError}</p>
        )}
        <Link href="/" className="font-body text-sm text-gold transition-colors hover:text-gold-light">
          ← Back to lobby
        </Link>
      </div>
    )
  }

  if (!gameState || status !== "playing" && status !== "opponent_disconnected") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-parchment-deep border-t-gold" />
          <p className="font-body text-sm text-warm-muted">{STATUS_MESSAGES[status] ?? "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {status === "opponent_disconnected" && (
        <div className="absolute inset-x-0 top-0 z-50 flex justify-center py-2">
          <span className="rounded-xl border border-gold/40 bg-gold/15 px-4 py-1.5 font-body text-xs text-warm-brown shadow-glow-gold">
            Opponent disconnected — waiting for reconnect...
          </span>
        </div>
      )}
      {lastError && (
        <div className="absolute inset-x-0 top-0 z-50 flex justify-center py-2">
          <span className="rounded-xl border border-life-red/40 bg-life-red/10 px-4 py-1.5 font-body text-xs text-life-red">
            Action rejected: {lastError}
          </span>
        </div>
      )}
      <GameBoard gameState={gameState} sendAction={sendAction} myPlayerId={playerId} latestBatch={latestBatch} />
    </div>
  )
}
