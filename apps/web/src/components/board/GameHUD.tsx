"use client"

import { useContext, useState } from "react"
import { motion } from "framer-motion"
import { Phase } from "@tcg/shared-types"
import type { ClientGameState } from "@/lib/types"
import { audioSystem } from "@/audio/audio-system"
import { AnimationQueueContext } from "@/animation/animation-queue-context"
import { damageShakeVariants } from "@/animation/framer-variants"

interface Props {
  gameState: ClientGameState
  myPlayerId: string
}

const PHASE_LABEL: Record<Phase, string> = {
  [Phase.START_TURN]: "Start",
  [Phase.MAIN_PHASE]: "Main",
  [Phase.ATTACK_PHASE]: "Attack",
  [Phase.END_TURN_SELECT]: "End Select",
  [Phase.END_TURN]: "End Turn",
}

const PHASE_COLOR: Record<Phase, string> = {
  [Phase.START_TURN]: "text-magic-sky",
  [Phase.MAIN_PHASE]: "text-gold",
  [Phase.ATTACK_PHASE]: "text-life-red",
  [Phase.END_TURN_SELECT]: "text-magic-purple",
  [Phase.END_TURN]: "text-magic-lavender",
}

export function GameHUD({ gameState, myPlayerId }: Props) {
  const opponentId = Object.keys(gameState.players).find((id) => id !== myPlayerId)
  const me = gameState.players[myPlayerId]
  const opponent = opponentId ? gameState.players[opponentId] : undefined
  const isMyTurn = gameState.activePlayer === myPlayerId

  const animCtx = useContext(AnimationQueueContext)
  const currentAnim = animCtx?.current
  const oppIsShaking = currentAnim?.kind === "PLAYER_DAMAGE_SHAKE" && currentAnim.targetPlayerId === opponentId
  const meIsShaking = currentAnim?.kind === "PLAYER_DAMAGE_SHAKE" && currentAnim.targetPlayerId === myPlayerId

  const [muted, setMuted] = useState(false)

  function toggleMute() {
    const next = !muted
    setMuted(next)
    audioSystem.setEnabled(!next)
  }

  const phaseColor = PHASE_COLOR[gameState.phase] ?? "text-warm-muted"

  return (
    <div className="flex items-center justify-between border-b-[3px] border-ink bg-parchment-2 px-5 py-2 shadow-ink-sm">
      {/* Left — turn info */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-warm-muted2">
          T<strong className="font-impact text-base text-warm-brown">{gameState.turn}</strong>
        </span>
        <span className="h-4 w-[2px] bg-ink/20" />
        <span className={`font-impact text-sm uppercase tracking-tight ${phaseColor}`}>
          {PHASE_LABEL[gameState.phase] ?? gameState.phase}
        </span>
        <span className="h-4 w-[2px] bg-ink/20" />
        <span
          className={
            isMyTurn
              ? "rounded-sm border-[2px] border-ink bg-magic-rose px-2 py-0.5 font-impact text-xs uppercase tracking-tight text-ink shadow-ink-sm"
              : "font-body text-xs text-warm-muted"
          }
        >
          {isMyTurn ? "YOUR TURN" : "Waiting..."}
        </span>
      </div>

      {/* Right — player health */}
      <div className="flex items-center gap-4">
        {opponent && (
          <motion.div
            className="flex items-center gap-2"
            variants={damageShakeVariants}
            animate={oppIsShaking ? "shake" : "idle"}
          >
            <span className="font-impact text-sm uppercase text-warm-muted">OPP</span>
            <span className="font-mono text-base font-bold text-life-red">♥{opponent.life}</span>
            <span className="rounded-sm border-[2px] border-ink bg-parchment px-1.5 py-0.5 font-mono text-[10px] font-bold text-warm-muted2 shadow-[1px_1px_0_#15131a]">Rev:{opponent.revolveCount}</span>
          </motion.div>
        )}
        <div className="h-6 w-[2px] bg-ink/30" />
        {me && (
          <motion.div
            className="flex items-center gap-2"
            variants={damageShakeVariants}
            animate={meIsShaking ? "shake" : "idle"}
          >
            <span className="font-impact text-sm uppercase text-warm-muted">YOU</span>
            <span className="font-mono text-base font-bold text-life-green">♥{me.life}</span>
            <div className="flex items-center gap-1">
              <span className="rounded-sm border-[2px] border-ink bg-gold px-1.5 py-0.5 font-impact text-xs text-ink shadow-[1px_1px_0_#15131a]">{me.temporaryResources}</span>
              <span className="font-mono text-[10px] text-warm-muted2">Rev:{me.revolveCount} Dk:{me.deck.length}</span>
            </div>
          </motion.div>
        )}
        <button
          onClick={toggleMute}
          title={muted ? "Unmute" : "Mute"}
          className="ml-1 rounded-sm border-[2px] border-ink px-1.5 py-0.5 text-[11px] text-warm-muted shadow-ink-sm transition-colors hover:bg-gold hover:text-ink"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  )
}
