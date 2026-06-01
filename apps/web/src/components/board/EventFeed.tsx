"use client"

import { useContext, useEffect, useRef } from "react"
import type { GameEvent } from "@tcg/shared-types"
import { AnimationQueueContext } from "@/animation/animation-queue-context"

interface Props {
  myPlayerId: string
  events?: GameEvent[]
  onClose?: () => void
}

interface FormattedEvent {
  text: string
  color: string
}

function formatEvent(event: GameEvent, myPlayerId: string): FormattedEvent | null {
  const me = (id: string) => (id === myPlayerId ? "You" : "Opp")

  switch (event.type) {
    case "UNIT_SUMMONED":
      return { text: `${me(event.owner)} → L${event.lane}`, color: "text-life-green" }
    case "UNIT_DESTROYED":
      return { text: `Destroyed L${event.lane}`, color: "text-life-red" }
    case "UNIT_DAMAGED":
      return { text: `Unit -${event.damage} (${event.remainingHealth}hp)`, color: "text-neon" }
    case "PLAYER_DAMAGED":
      return { text: `${me(event.playerId)} -${event.damage}hp`, color: "text-life-red" }
    case "PLAYER_HEALED":
      return { text: `${me(event.playerId)} +${event.amount}hp`, color: "text-life-green" }
    case "CARD_INFUSED":
      return { text: `Infuse +${event.resourcesGenerated}`, color: "text-neon" }
    case "REVOLVE_TRIGGERED":
      return { text: `${me(event.playerId)} revolve ×${event.revolveCount}`, color: "text-cyber-purple" }
    case "ACE_UNLOCKED":
      return { text: `${me(event.playerId)} ACE!`, color: "text-neon font-bold" }
    case "FATIGUE_DAMAGE":
      return { text: `${me(event.playerId)} fatigue -${event.damage}`, color: "text-life-red" }
    case "PHASE_CHANGED":
      return { text: `→ ${event.to}`, color: "text-text-muted2" }
    case "TURN_STARTED":
      return { text: `T${event.turn} ${me(event.activePlayer)}`, color: "text-cyber-sky font-semibold" }
    case "UNIT_PRIMED":
      return { text: "Unit PRIMED", color: "text-cyber-pink" }
    case "SPELLSHIELD_NEGATED":
      return { text: "Spellshield!", color: "text-cyber-violet" }
    case "ABILITY_ACTIVATED":
      return { text: "Ability used", color: "text-neon" }
    case "UNIT_BUFFED":
      return {
        text: `Buffed +${event.attackDelta}/+${event.healthDelta}`,
        color: "text-life-green",
      }
    case "GAME_OVER":
      return {
        text: event.isDraw ? "Draw!" : `${me(event.winner ?? "")} wins!`,
        color: "text-neon font-bold",
      }
    default:
      return null
  }
}

export function EventFeed({ myPlayerId, events: eventsProp, onClose }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const ctx = useContext(AnimationQueueContext)

  const events = ctx ? ctx.completedEvents : (eventsProp ?? [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  const visible = events.slice(-50)

  return (
    <div className="flex w-48 flex-shrink-0 flex-col border-l-[2px] border-rim/80 bg-panel shadow-[-4px_0_16px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b-[2px] border-rim/80 bg-panel-deep px-3 py-2">
        <span className="font-impact text-[11px] uppercase tracking-tight text-text-primary">EVENTS</span>
        {onClose && (
          <button onClick={onClose} className="font-impact text-sm leading-none text-text-muted transition-colors hover:text-text-primary">×</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {visible.map((event, i) => {
          const f = formatEvent(event, myPlayerId)
          if (!f) return null
          return (
            <p key={i} className={`py-0.5 font-mono text-[10px] leading-tight ${f.color}`}>
              {f.text}
            </p>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
