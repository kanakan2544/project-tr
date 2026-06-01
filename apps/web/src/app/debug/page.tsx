"use client"

import { useDebugClient } from "@/hooks/useDebugClient"
import { PlayerDebugPanel } from "@/components/debug/PlayerDebugPanel"
import { EventLog } from "@/components/debug/EventLog"
import { StateInspector } from "@/components/debug/StateInspector"

export default function DebugPage() {
  const { gameState, connected, connectError, eventLog, lastError, historyLen, historyIndex, dispatch, reset, stepBack } =
    useDebugClient()

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-parchment">
        {connectError ? (
          <>
            <p className="font-display text-sm text-life-red">Connection failed</p>
            <p className="font-mono text-xs text-warm-muted">{connectError}</p>
            <p className="font-body text-xs text-warm-muted2">
              Make sure the server is running:{" "}
              <code className="rounded border border-parchment-deep bg-parchment-2 px-1.5 py-0.5 font-mono text-warm-brown">
                pnpm --filter @tcg/server dev
              </code>
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-parchment-deep border-t-gold" />
            <p className="font-body text-sm text-warm-muted">Connecting to debug server...</p>
          </div>
        )}
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <p className="font-body text-warm-muted">Waiting for game state...</p>
      </div>
    )
  }

  const playerIds = Object.keys(gameState.players)
  const p1Id = playerIds[0]!
  const p2Id = playerIds[1]!
  const p1 = gameState.players[p1Id]!
  const p2 = gameState.players[p2Id]!

  const isGameOver = gameState.winner !== null || gameState.isDraw

  return (
    <div className="relative min-h-screen bg-parchment p-4">
      <div className="tex-grid opacity-40" />

      {/* Toolbar */}
      <div className="relative z-10 mb-4 flex flex-wrap items-center gap-3 rounded-sm border-[3px] border-ink bg-parchment-2 px-4 py-2.5 shadow-ink-sm">
        <span className="font-impact text-sm uppercase text-gold" style={{ textShadow: "2px 2px 0 #15131a" }}>DEBUG SANDBOX</span>
        <span className="font-mono text-xs text-warm-muted">
          T<strong className="font-impact text-base text-warm-brown">{gameState.turn}</strong>{" "}
          <span className="font-impact text-xs uppercase text-magic-purple">{gameState.phase}</span>{" "}
          <strong className="text-warm-muted">{gameState.activePlayer}</strong>
        </span>

        {isGameOver && (
          <span className="rounded-sm border-[2px] border-ink bg-gold px-2 py-0.5 font-impact text-xs uppercase text-ink shadow-ink-sm">
            {gameState.isDraw ? "DRAW" : `${gameState.winner} WINS`}
          </span>
        )}

        <div className="ml-auto flex gap-2">
          <button
            onClick={stepBack}
            disabled={historyIndex < 0}
            title={`Step back (${historyIndex + 1}/${historyLen})`}
            className="rounded-sm border-[2px] border-ink bg-parchment px-3 py-1 font-impact text-xs uppercase text-warm-muted shadow-ink-sm transition-all hover:bg-parchment-deep hover:shadow-none disabled:opacity-40"
          >
            ◀ STEP ({historyIndex + 1}/{historyLen})
          </button>
          <button
            onClick={reset}
            className="rounded-sm border-[2px] border-ink bg-life-red px-3 py-1 font-impact text-xs uppercase text-parchment shadow-ink-sm transition-all hover:shadow-none"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Main layout: P1 | P2 | Event Log */}
      <div className="relative z-10 grid grid-cols-[1fr_1fr_320px] gap-4">
        <PlayerDebugPanel playerId={p1Id} player={p1} gameState={gameState} dispatch={dispatch} side="left" />
        <PlayerDebugPanel playerId={p2Id} player={p2} gameState={gameState} dispatch={dispatch} side="right" />
        <EventLog entries={eventLog} lastError={lastError} />
      </div>

      {/* State inspector */}
      <div className="relative z-10 mt-4">
        <StateInspector state={gameState} />
      </div>
    </div>
  )
}
