"use client"

import { useState } from "react"
import type { GameState } from "@tcg/shared-types"

interface Props {
  state: GameState
}

export function StateInspector({ state }: Props) {
  const [open, setOpen] = useState(false)

  const slimState = {
    matchId: state.matchId,
    turn: state.turn,
    phase: state.phase,
    activePlayer: state.activePlayer,
    winner: state.winner,
    isDraw: state.isDraw,
    players: Object.fromEntries(
      Object.entries(state.players).map(([id, p]) => [
        id,
        {
          life: p.life,
          resources: p.temporaryResources,
          revolveCount: p.revolveCount,
          deckSize: p.deck.length,
          handSize: p.hand.length,
          hand: p.hand.map((c) => `${c.cardId}${c.primedInfuseCount > 0 ? `(×${c.primedInfuseCount})` : ""}`),
          battlefield: p.battlefield
            .filter((l) => l.unit)
            .map((l) => ({
              lane: l.index,
              card: l.unit!.cardId,
              atk: l.unit!.attack,
              hp: `${l.unit!.currentHealth}/${l.unit!.maxHealth}`,
              status: l.unit!.status,
              isPrimed: l.unit!.isPrimed,
            })),
        },
      ])
    ),
  }

  return (
    <div className="rounded-sm border-[3px] border-ink shadow-ink-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-ink px-4 py-2 text-left transition-colors hover:bg-ink/80"
      >
        <span className="font-impact text-sm uppercase text-parchment">STATE INSPECTOR</span>
        <span className="font-mono text-xs text-parchment/60">{open ? "▲ HIDE" : "▼ SHOW"}</span>
      </button>
      {open && (
        <pre className="max-h-80 overflow-auto border-t-[3px] border-ink bg-parchment-deep/30 p-3 font-mono text-[10px] text-warm-muted">
          {JSON.stringify(slimState, null, 2)}
        </pre>
      )}
    </div>
  )
}
