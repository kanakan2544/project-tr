"use client"

import { useState, useEffect } from "react"
import type { PlayerState, GameState, GameAction, CardInstance } from "@tcg/shared-types"
import { ActionType, Phase } from "@tcg/shared-types"

interface Props {
  playerId: string
  player: PlayerState
  gameState: GameState
  dispatch: (playerId: string, action: GameAction) => void
  side: "left" | "right"
}

export function PlayerDebugPanel({ playerId, player, gameState, dispatch, side }: Props) {
  const isActive = gameState.activePlayer === playerId
  const isMain = gameState.phase === Phase.MAIN_PHASE
  const isEndTurnSelect = gameState.phase === Phase.END_TURN_SELECT && isActive

  const hand = player.hand as CardInstance[]
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, hand.length - 1)))
  }, [hand.length])

  const selectedCard = hand[selectedIndex] ?? hand[0]

  function infuseSelected() {
    if (!selectedCard) return
    dispatch(playerId, { type: ActionType.INFUSE_CARD, playerId, cardInstanceId: selectedCard.instanceId })
  }

  function summonSelected(lane: number) {
    if (!selectedCard) return
    dispatch(playerId, { type: ActionType.SUMMON_UNIT, playerId, cardInstanceId: selectedCard.instanceId, targetLane: lane })
  }

  function endMain() {
    dispatch(playerId, { type: ActionType.END_MAIN_PHASE, playerId })
  }

  function autoEndTurnSelect() {
    const keep = hand.slice(0, 2).map((c) => c.instanceId)
    dispatch(playerId, { type: ActionType.END_TURN_SELECT, playerId, keepInstanceIds: keep })
  }

  return (
    <div className={`flex flex-col gap-3 rounded-sm border-[3px] p-3 text-xs ${
      isActive ? "border-ink bg-gold/10 shadow-ink-gold" : "border-ink bg-parchment-2 shadow-ink-sm"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`font-impact text-sm uppercase ${isActive ? "text-gold" : "text-warm-muted"}`}
          style={isActive ? { textShadow: "2px 2px 0 #15131a" } : {}}>
          {playerId} {isActive ? `— ${gameState.phase}` : ""}
        </span>
        <div className="flex gap-2">
          <span className="rounded-sm border-[2px] border-ink bg-life-red px-1.5 py-0.5 font-mono text-[10px] font-bold text-parchment shadow-[1px_1px_0_#15131a]">♥{player.life}</span>
          <span className="rounded-sm border-[2px] border-ink bg-gold px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink shadow-[1px_1px_0_#15131a]">{player.temporaryResources}</span>
          <span className="rounded-sm border-[2px] border-ink bg-magic-purple px-1.5 py-0.5 font-mono text-[10px] font-bold text-parchment shadow-[1px_1px_0_#15131a]">Rev{player.revolveCount}</span>
        </div>
      </div>

      {/* Deck / Revolve counts */}
      <div className="flex gap-3 font-mono text-warm-muted2">
        <span>Deck: {player.deck.length}</span>
        <span>Revolve: {player.revolvePile.length}</span>
        <span>Discard: {player.discardPile.length}</span>
        {player.ace && <span className="text-gold">ACE: {player.ace.cardId}</span>}
      </div>

      {/* Battlefield */}
      <div>
        <div className="mb-1 font-display text-[10px] uppercase tracking-widest text-warm-muted">Battlefield</div>
        <div className={`flex gap-1 ${side === "right" ? "flex-row-reverse" : "flex-row"}`}>
          {player.battlefield.map((lane) => (
            <div
              key={lane.index}
              className="flex h-20 w-16 flex-col items-center justify-center rounded-sm border-[2px] border-ink bg-parchment p-1 shadow-ink-sm"
            >
              {lane.unit ? (
                <>
                  <span className="w-14 truncate text-center font-display text-[9px] font-bold uppercase text-warm-brown">{lane.unit.cardId.replace(/_/g, " ")}</span>
                  <span className="font-mono text-[10px] font-bold">
                    <span className="text-life-red">{lane.unit.attack}</span>
                    <span className="text-ink font-bold">/</span>
                    <span className="text-magic-sky">{lane.unit.currentHealth}</span>
                  </span>
                  {lane.unit.status.standBy && <span className="rounded-sm border border-ink bg-gold px-0.5 font-impact text-[7px] uppercase text-ink">WAIT</span>}
                  {lane.unit.status.silenced && <span className="rounded-sm border border-ink bg-magic-purple px-0.5 font-impact text-[7px] uppercase text-parchment">SIL</span>}
                  {lane.unit.isPrimed && <span className="rounded-sm border border-ink bg-magic-rose px-0.5 font-impact text-[7px] uppercase text-ink">PRIME</span>}
                </>
              ) : (
                <span className="font-impact text-[10px] uppercase text-warm-muted2">{lane.index}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hand */}
      <div>
        <div className="mb-1 font-display text-[10px] uppercase tracking-widest text-warm-muted">
          Hand ({hand.length}) {isMain && hand.length > 0 && <span className="font-body normal-case tracking-normal text-warm-muted2">— click to select</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {hand.map((card, i) => (
            <div
              key={card.instanceId}
              onClick={() => setSelectedIndex(i)}
              className={`cursor-pointer rounded-sm border-[2px] border-ink px-2 py-1 font-impact text-[10px] uppercase transition-all ${
                i === selectedIndex
                  ? "bg-gold text-ink shadow-ink-sm"
                  : "bg-parchment text-warm-muted shadow-[1px_1px_0_#15131a] hover:bg-gold/30 hover:text-warm-brown"
              }`}
            >
              {card.cardId.replace(/_/g, " ")}
              {card.primedInfuseCount > 0 && <span className="ml-1 font-bold text-magic-purple">×{card.primedInfuseCount}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex flex-wrap gap-2">
          {isMain && (
            <>
              <button
                onClick={infuseSelected}
                disabled={!selectedCard}
                className="rounded-sm border-[2px] border-ink bg-gold px-2 py-1 font-impact text-[11px] uppercase text-ink shadow-ink-sm transition-all hover:shadow-none disabled:opacity-40"
              >
                INFUSE
              </button>
              {[0, 1, 2, 3, 4].map((lane) => (
                <button
                  key={lane}
                  onClick={() => summonSelected(lane)}
                  disabled={!selectedCard || !!player.battlefield[lane]?.unit}
                  className="rounded-sm border-[2px] border-ink bg-parchment px-2 py-1 font-impact text-[11px] uppercase text-warm-muted shadow-[1px_1px_0_#15131a] transition-all hover:bg-parchment-deep hover:shadow-none disabled:opacity-40"
                >
                  →{lane}
                </button>
              ))}
              <button
                onClick={endMain}
                className="rounded-sm border-[2px] border-ink bg-parchment px-2 py-1 font-impact text-[11px] uppercase text-warm-muted shadow-[1px_1px_0_#15131a] transition-all hover:bg-parchment-deep hover:shadow-none"
              >
                END MAIN
              </button>
            </>
          )}
          {isEndTurnSelect && (
            <button
              onClick={autoEndTurnSelect}
              className="rounded-sm border-[2px] border-ink bg-magic-purple px-2 py-1 font-impact text-[11px] uppercase text-parchment shadow-ink-sm transition-all hover:shadow-none"
            >
              KEEP TOP 2
            </button>
          )}
        </div>
      )}
    </div>
  )
}
