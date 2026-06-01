"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent, Active } from "@dnd-kit/core"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { getCard } from "@tcg/card-data"
import { Phase, ActionType, CardType, TargetType, TriggerType } from "@tcg/shared-types"
import type { GameAction, CardInstance, UnitInstance, LaneState, GameEvent, ActivatedAbility, TriggeredAbility } from "@tcg/shared-types"
import type { ClientGameState } from "@/lib/types"
import { useTargetSelection } from "@/hooks/useTargetSelection"
import { AnimationQueueProvider, useAnimationQueue } from "@/animation/animation-queue-context"
import { damageShakeVariants, feedSlideVariants } from "@/animation/framer-variants"
import { audioSystem } from "@/audio/audio-system"
import { HandDisplay, OpponentHandDisplay } from "./HandDisplay"
import { CardView } from "./CardView"
import { UnitOnBoard } from "./UnitOnBoard"
import { AceSlot } from "./AceSlot"
import { EventFeed } from "./EventFeed"
import { InfuseZone } from "./InfuseZone"
import { PileModal } from "./PileModal"
import { CardTooltipProvider, useCardTooltip } from "./CardTooltipContext"
import { PhaseBanner } from "@/components/animation/PhaseBanner"
import { TurnIndicator } from "@/components/animation/TurnIndicator"
import { GameOverCelebration } from "@/components/animation/GameOverCelebration"

// ---- Helpers ----

interface DragData {
  type: "hand-card" | "ace-card"
  cardInstanceId: string
  cardId: string
}

function tryGetCard(id: string) {
  try { return getCard(id) } catch { return null }
}

function isUnitTargetValid(unit: UnitInstance, types: TargetType[], myPlayerId: string): boolean {
  const isAlly = unit.owner === myPlayerId
  return types.some((t) => {
    switch (t) {
      case TargetType.ALLY_UNIT: return isAlly
      case TargetType.ENEMY_UNIT: return !isAlly
      case TargetType.ANY_UNIT:
      case TargetType.ALL_UNITS: return true
      case TargetType.ALL_ENEMY_UNITS: return !isAlly
      default: return false
    }
  })
}

const EXPLICIT_TARGETS = new Set([
  TargetType.ALLY_UNIT, TargetType.ENEMY_UNIT, TargetType.ANY_UNIT,
  TargetType.ALLY_PLAYER, TargetType.ENEMY_PLAYER,
])

const PHASE_LABEL: Record<Phase, string> = {
  [Phase.START_TURN]: "Start",
  [Phase.MAIN_PHASE]: "Main",
  [Phase.ATTACK_PHASE]: "Attack",
  [Phase.END_TURN_SELECT]: "End Select",
  [Phase.END_TURN]: "End Turn",
}

const PHASE_COLOR: Record<Phase, string> = {
  [Phase.START_TURN]: "text-cyber-sky",
  [Phase.MAIN_PHASE]: "text-neon",
  [Phase.ATTACK_PHASE]: "text-life-red",
  [Phase.END_TURN_SELECT]: "text-cyber-purple",
  [Phase.END_TURN]: "text-text-muted",
}

const PHASE_ORDER = [
  Phase.START_TURN, Phase.MAIN_PHASE, Phase.ATTACK_PHASE,
  Phase.END_TURN_SELECT, Phase.END_TURN,
]

const PHASE_SHORT: Record<Phase, string> = {
  [Phase.START_TURN]: "Start",
  [Phase.MAIN_PHASE]: "Main",
  [Phase.ATTACK_PHASE]: "Attack",
  [Phase.END_TURN_SELECT]: "Select",
  [Phase.END_TURN]: "End",
}

const PHASE_BG: Record<Phase, string> = {
  [Phase.START_TURN]: "bg-cyber-sky/25",
  [Phase.MAIN_PHASE]: "bg-neon/25",
  [Phase.ATTACK_PHASE]: "bg-life-red/25",
  [Phase.END_TURN_SELECT]: "bg-cyber-purple/25",
  [Phase.END_TURN]: "bg-panel/40",
}

// ---- Sub-components ----

function LaneDropZone({
  lane,
  isMyLane,
  acceptsDrop,
  isTargetable,
  accent = "cyan",
  onUnitClick,
  onAbilityClick,
}: {
  lane: LaneState
  isMyLane: boolean
  acceptsDrop: boolean
  isTargetable: boolean
  accent?: "cyan" | "foe"
  onUnitClick?: (() => void) | undefined
  onAbilityClick?: ((uid: string, index: number) => void) | undefined
}) {
  const id = lane.unit ? `drop:unit:${lane.unit.instanceId}` : `drop:lane:${lane.index}`
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !acceptsDrop })

  if (!lane.unit) {
    const isFoe = accent === "foe"
    const cornerColor = acceptsDrop
      ? "border-neon/60"
      : isFoe ? "border-foe/40" : "border-rim/25"
    return (
      <div
        ref={setNodeRef}
        className={[
          "relative flex h-40 w-32 flex-col items-center justify-center rounded-sm border-[2px] text-xs transition-all",
          acceptsDrop
            ? isOver
              ? "border-neon bg-neon/10 shadow-glow-neon"
              : "border-neon/50 bg-neon/5"
            : "border-rim/20 bg-panel-deep/60",
        ].join(" ")}
      >
        {/* Corner accent marks */}
        <span className={`pointer-events-none absolute top-1 left-1 h-2.5 w-2.5 border-t-[2px] border-l-[2px] ${cornerColor}`} />
        <span className={`pointer-events-none absolute top-1 right-1 h-2.5 w-2.5 border-t-[2px] border-r-[2px] ${cornerColor}`} />
        <span className={`pointer-events-none absolute bottom-1 left-1 h-2.5 w-2.5 border-b-[2px] border-l-[2px] ${cornerColor}`} />
        <span className={`pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 border-b-[2px] border-r-[2px] ${cornerColor}`} />
        <span className={`font-impact text-[10px] uppercase ${acceptsDrop ? "text-neon" : isFoe ? "text-foe/50" : "text-text-muted2/50"}`}>
          {lane.index}
        </span>
      </div>
    )
  }

  return (
    <div ref={setNodeRef}>
      <UnitOnBoard
        unit={lane.unit}
        isMyUnit={isMyLane}
        isTargetable={isTargetable}
        onAbilityClick={onAbilityClick}
        onClick={isTargetable || (isMyLane && !!onAbilityClick) ? onUnitClick : undefined}
      />
    </div>
  )
}

function PlayerTargetZone({
  droppableId,
  isTargetable,
  onClick,
}: {
  droppableId: string
  isTargetable: boolean
  onClick?: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId, disabled: !isTargetable })
  if (!isTargetable) return null
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={[
        "h-3 w-full cursor-pointer rounded-sm border-[3px] border-dashed transition-all",
        isOver ? "border-cyber-pink bg-cyber-pink/20 shadow-glow-pink" : "border-cyber-pink/60 bg-cyber-pink/10",
      ].join(" ")}
    />
  )
}

// ---- Main Component ----

interface Props {
  gameState: ClientGameState
  sendAction: (action: GameAction) => void
  myPlayerId: string
  latestBatch: GameEvent[]
}

export function GameBoard(props: Props) {
  return (
    <AnimationQueueProvider>
      <CardTooltipProvider>
        <GameBoardInner {...props} />
      </CardTooltipProvider>
    </AnimationQueueProvider>
  )
}

function GameBoardInner({ gameState, sendAction, myPlayerId, latestBatch }: Props) {
  const { enqueue, setPaused, isIdle, current: currentAnim } = useAnimationQueue()
  const { show: showTooltip, hide: hideTooltip } = useCardTooltip()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [activeDrag, setActiveDrag] = useState<Active | null>(null)
  const [endTurnKeepIds, setEndTurnKeepIds] = useState<string[]>([])
  const [displayedState, setDisplayedState] = useState<ClientGameState>(gameState)
  const [showFeed, setShowFeed] = useState(false)
  const [muted, setMuted] = useState(false)
  const [pileModal, setPileModal] = useState<{ title: string; cards: CardInstance[]; faceDown?: boolean } | null>(null)

  useEffect(() => {
    if (latestBatch.length > 0) enqueue(latestBatch)
  }, [latestBatch, enqueue])

  useEffect(() => {
    setPaused(!!activeDrag)
  }, [activeDrag, setPaused])

  useEffect(() => {
    if (isIdle) setDisplayedState(gameState)
  }, [isIdle, gameState])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const opponentId = Object.keys(gameState.players).find((id) => id !== myPlayerId) ?? ""
  const me = gameState.players[myPlayerId]
  const opponent = opponentId ? gameState.players[opponentId] : undefined
  const isMyTurn = gameState.activePlayer === myPlayerId
  const isMainPhase = gameState.phase === Phase.MAIN_PHASE
  const isEndTurnSelect = gameState.phase === Phase.END_TURN_SELECT && isMyTurn

  const canAct = isMyTurn && isMainPhase

  const myHand = Array.isArray(me?.hand) ? (me.hand as CardInstance[]) : []
  const selectedHandCard = myHand.find((c) => c.instanceId === selectedCardId)
  const selectedAce = me?.ace?.instanceId === selectedCardId ? me.ace : undefined
  const selectedCard = selectedHandCard ?? selectedAce

  const opponentHandCount =
    opponent && !Array.isArray(opponent.hand)
      ? (opponent.hand as { count: number }).count
      : Array.isArray(opponent?.hand)
      ? (opponent!.hand as CardInstance[]).length
      : 0

  const targetSel = useTargetSelection(myPlayerId)

  // ---- Drag state derived values ----

  const dragData = activeDrag?.data.current as DragData | undefined
  const isDraggingCard = !!activeDrag
  const draggedCard = dragData?.cardId ? tryGetCard(dragData.cardId) : null
  const draggedCardType =
    dragData?.type === "ace-card" ? CardType.Unit : (draggedCard?.type ?? null)

  const isDraggingUnit = isDraggingCard && draggedCardType === CardType.Unit
  const isDraggingSpell = isDraggingCard && draggedCardType === CardType.Spell
  const draggedSpellTargetTypes: TargetType[] = isDraggingSpell
    ? (draggedCard?.abilities ?? [])
        .filter((a): a is TriggeredAbility => a.kind === "triggered" && a.trigger === TriggerType.ON_PLAY)
        .flatMap((a) => a.actions.flatMap((ac) => "target" in ac ? [ac.target] : []))
    : []

  // ---- Per-unit targetability ----

  function isUnitTargetable(unit: UnitInstance): boolean {
    if (targetSel.state.mode !== "none" && targetSel.isValidUnitTarget(unit)) return true
    if (isDraggingSpell && isUnitTargetValid(unit, draggedSpellTargetTypes, myPlayerId)) return true
    return false
  }

  function playerTargetable(playerId: string): boolean {
    if (targetSel.state.mode !== "none" && targetSel.isValidPlayerTarget(playerId)) return true
    if (isDraggingSpell) {
      const isSelf = playerId === myPlayerId
      return draggedSpellTargetTypes.some((t) =>
        (t === TargetType.ALLY_PLAYER && isSelf) || (t === TargetType.ENEMY_PLAYER && !isSelf)
      )
    }
    return false
  }

  function laneAcceptsDrop(lane: LaneState, isMyLane: boolean): boolean {
    if (!canAct) return false
    if (!lane.unit && isMyLane && isDraggingUnit) return true
    if (lane.unit && isDraggingSpell && isUnitTargetable(lane.unit)) return true
    return false
  }

  // ---- DnD handlers ----

  function handleDragStart(e: DragStartEvent) {
    setActiveDrag(e.active)
    setSelectedCardId(null)
    targetSel.cancel()
    const data = e.active.data.current as DragData | undefined
    if (data?.cardId) {
      const pe = e.activatorEvent as PointerEvent
      showTooltip(data.cardId, pe.clientX ?? 0, pe.clientY ?? 0)
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveDrag(null)
    hideTooltip()
    if (!over || !canAct || !dragData) return

    const overId = over.id as string
    const { cardInstanceId, cardId } = dragData

    if (overId === "drop:infuse" || overId === "drop:infuse:right" || overId === "drop:infuse:mid") {
      sendAction({ type: ActionType.INFUSE_CARD, playerId: myPlayerId, cardInstanceId })
      return
    }

    if (overId.startsWith("drop:lane:")) {
      const laneIndex = parseInt(overId.split(":")[2]!)
      sendAction({ type: ActionType.SUMMON_UNIT, playerId: myPlayerId, cardInstanceId, targetLane: laneIndex })
      return
    }

    if (overId.startsWith("drop:unit:")) {
      const targetInstanceId = overId.slice("drop:unit:".length)
      const card = tryGetCard(cardId)
      if (card?.type === CardType.Spell) {
        sendAction({ type: ActionType.CAST_SPELL, playerId: myPlayerId, cardInstanceId, targetInstanceId })
      }
      return
    }

    if (overId === "drop:player:opp" || overId === "drop:player:me") {
      const targetPlayerId = overId === "drop:player:me" ? myPlayerId : opponentId
      const card = tryGetCard(cardId)
      if (card?.type === CardType.Spell) {
        sendAction({ type: ActionType.CAST_SPELL, playerId: myPlayerId, cardInstanceId, targetPlayerId })
      }
    }
  }

  // ---- Click handlers ----

  function handleCardClick(instanceId: string) {
    if (isEndTurnSelect) {
      setEndTurnKeepIds((prev) =>
        prev.includes(instanceId)
          ? prev.filter((id) => id !== instanceId)
          : prev.length >= 2 ? prev : [...prev, instanceId]
      )
      return
    }
    if (!canAct) return
    if (selectedCardId === instanceId) {
      setSelectedCardId(null)
      targetSel.cancel()
      return
    }
    setSelectedCardId(instanceId)
    targetSel.cancel()

    const inst = myHand.find((c) => c.instanceId === instanceId) ?? me?.ace
    if (!inst) return

    const card = tryGetCard(inst.cardId)
    if (card?.type === CardType.Spell) {
      const types = (card.abilities ?? [])
        .filter((a): a is TriggeredAbility => a.kind === "triggered" && a.trigger === TriggerType.ON_PLAY)
        .flatMap((a) => a.actions.flatMap((ac) => "target" in ac ? [ac.target] : []))
      if (types.some((t) => EXPLICIT_TARGETS.has(t))) {
        targetSel.startSpellTarget(instanceId, types)
      }
    }
  }

  function handleUnitClick(unit: UnitInstance) {
    if (targetSel.state.mode === "spell") {
      const { cardInstanceId } = targetSel.state
      sendAction({
        type: ActionType.CAST_SPELL,
        playerId: myPlayerId,
        cardInstanceId,
        targetInstanceId: unit.instanceId,
      })
      setSelectedCardId(null)
      targetSel.cancel()
    } else if (targetSel.state.mode === "ability") {
      const { unitInstanceId, abilityIndex } = targetSel.state
      sendAction({
        type: ActionType.ACTIVATE_ABILITY,
        playerId: myPlayerId,
        unitInstanceId,
        abilityIndex,
        targetInstanceId: unit.instanceId,
      })
      targetSel.cancel()
    }
  }

  function handlePlayerClick(clickedId: string) {
    if (targetSel.state.mode === "spell") {
      const { cardInstanceId } = targetSel.state
      sendAction({
        type: ActionType.CAST_SPELL,
        playerId: myPlayerId,
        cardInstanceId,
        targetPlayerId: clickedId,
      })
      setSelectedCardId(null)
      targetSel.cancel()
    } else if (targetSel.state.mode === "ability") {
      const { unitInstanceId, abilityIndex } = targetSel.state
      sendAction({
        type: ActionType.ACTIVATE_ABILITY,
        playerId: myPlayerId,
        unitInstanceId,
        abilityIndex,
        targetPlayerId: clickedId,
      })
      targetSel.cancel()
    }
  }

  function handleAbilityClick(unitInstanceId: string, abilityIndex: number) {
    if (!canAct) return
    const unit = me?.battlefield.find((l) => l.unit?.instanceId === unitInstanceId)?.unit
    if (!unit) return
    const card = tryGetCard(unit.cardId)
    if (card?.type !== CardType.Unit) return
    const activatedAbilities = (card.abilities ?? []).filter(
      (a): a is ActivatedAbility => a.kind === "activated"
    )
    const ability = activatedAbilities[abilityIndex]
    if (!ability) return
    const types = ability.actions.flatMap((ac) => "target" in ac ? [ac.target] : [])
    if (types.some((t) => EXPLICIT_TARGETS.has(t))) {
      targetSel.startAbilityTarget(unitInstanceId, abilityIndex, types)
    } else {
      sendAction({ type: ActionType.ACTIVATE_ABILITY, playerId: myPlayerId, unitInstanceId, abilityIndex })
    }
  }

  function handleInfuse() {
    if (!selectedCardId || !canAct) return
    sendAction({ type: ActionType.INFUSE_CARD, playerId: myPlayerId, cardInstanceId: selectedCardId })
    setSelectedCardId(null)
    targetSel.cancel()
  }

  function handleCastAoE() {
    if (targetSel.state.mode !== "spell") return
    sendAction({ type: ActionType.CAST_SPELL, playerId: myPlayerId, cardInstanceId: targetSel.state.cardInstanceId })
    setSelectedCardId(null)
    targetSel.cancel()
  }

  function handleEndMainPhase() {
    if (!canAct) return
    sendAction({ type: ActionType.END_MAIN_PHASE, playerId: myPlayerId })
    setSelectedCardId(null)
    targetSel.cancel()
  }

  function handleEndTurnSelect(keepIds: string[]) {
    sendAction({ type: ActionType.END_TURN_SELECT, playerId: myPlayerId, keepInstanceIds: keepIds })
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    audioSystem.setEnabled(!next)
  }

  const oppIsShaking = currentAnim?.kind === "PLAYER_DAMAGE_SHAKE" && currentAnim.targetPlayerId === opponentId
  const meIsShaking = currentAnim?.kind === "PLAYER_DAMAGE_SHAKE" && currentAnim.targetPlayerId === myPlayerId
  const phaseColor = PHASE_COLOR[gameState.phase] ?? "text-warm-muted"

  const selCard = selectedCard ? tryGetCard(selectedCard.cardId) : null
  const isSelSpell = selCard?.type === CardType.Spell
  const isSelAoE = isSelSpell
    ? (selCard!.abilities ?? [])
        .filter((a): a is TriggeredAbility => a.kind === "triggered" && a.trigger === TriggerType.ON_PLAY)
        .flatMap((a) => a.actions.flatMap((ac) => "target" in ac ? [ac.target] : []))
        .some((t) => t === TargetType.ALL_UNITS || t === TargetType.ALL_ENEMY_UNITS)
    : false

  const infuseActive = isDraggingCard
  const draggedInfuseVal = draggedCard?.infuse

  const { setNodeRef: setInfusePanelRef, isOver: isInfusePanelOver } = useDroppable({
    id: "drop:infuse:right",
    disabled: !canAct,
  })

  const { setNodeRef: setInfuseMidRef, isOver: isInfuseMidOver } = useDroppable({
    id: "drop:infuse:mid",
    disabled: !canAct,
  })

  if (!me) return (
    <div className="flex min-h-screen items-center justify-center bg-void">
      <p className="font-body text-text-muted">Waiting for game state...</p>
    </div>
  )

  const displayedMe = displayedState.players[myPlayerId] ?? me
  const displayedOpponent = opponentId ? (displayedState.players[opponentId] ?? opponent) : undefined

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="relative h-screen overflow-hidden bg-void"
        style={{ display: "grid", gridTemplateColumns: "12.5% 1fr 19%", gridTemplateRows: "0.4fr 2.2fr 36px 2.2fr 1.8fr" }}
      >
        {/* Animated grid drift */}
        <div className="tex-grid-animated pointer-events-none fixed inset-0 z-0 opacity-80" />

        {/* Ambient floating orbs */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <motion.div
            className="absolute bottom-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-neon/[0.07] blur-3xl"
            animate={{ x: [0, 50, -25, 0], y: [0, -40, 25, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/4 right-1/3 h-[420px] w-[420px] rounded-full bg-foe/[0.07] blur-3xl"
            animate={{ x: [0, -40, 35, 0], y: [0, 30, -30, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyber-purple/[0.05] blur-3xl"
            animate={{ scale: [1, 1.4, 0.85, 1.1, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </div>

        <LayoutGroup>

          {/* ── Row 0 Col 0: Opponent deck / pile info ── */}
          <div className="col-start-1 row-start-1 flex flex-col items-center justify-center gap-0.5 border-b-[2px] border-r-[2px] border-rim/60 px-2 py-1">
            <button
              className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/50 bg-panel/70 px-2 py-0.5 font-impact text-[9px] uppercase transition-all hover:bg-panel-mid hover:border-foe/60 hover:text-foe"
              onClick={() => opponent && setPileModal({ title: "Opp Deck", cards: opponent.deck, faceDown: true })}
            ><span className="text-text-muted">DECK</span><b className="font-mono font-bold text-xs text-text-primary">{opponent?.deck.length ?? 0}</b></button>
            <div className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/20 bg-panel/40 px-2 py-0.5 font-impact text-[9px] uppercase">
              <span className="text-text-muted2">HAND</span><b className="font-mono font-bold text-xs text-text-primary">{opponentHandCount}</b>
            </div>
            <button
              className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/50 bg-panel/70 px-2 py-0.5 font-impact text-[9px] uppercase transition-all hover:bg-panel-mid hover:border-foe/60 hover:text-foe"
              onClick={() => opponent && setPileModal({ title: "Opp Discard", cards: opponent.discardPile ?? [] })}
            ><span className="text-text-muted">DISCARD</span><b className="font-mono font-bold text-xs text-text-primary">{opponent?.discardPile?.length ?? 0}</b></button>
          </div>

          {/* ── Row 0 Col 1: Opponent hand (back-face) ── */}
          <div className="col-start-2 row-start-1 flex items-center justify-center border-b-[2px] border-rim/60 px-2">
            <OpponentHandDisplay count={opponentHandCount} />
          </div>

          {/* ── Row 0 Col 2: Revolve pile + controls ── */}
          <div className="col-start-3 row-start-1 flex flex-col items-center justify-center gap-1 border-b-[2px] border-l-[2px] border-rim/60 px-2 py-1">
            <button
              className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/50 bg-panel/70 px-2 py-0.5 font-impact text-[9px] uppercase transition-all hover:bg-panel-mid hover:border-foe/60 hover:text-foe"
              onClick={() => opponent && setPileModal({ title: "Opp Revolve", cards: opponent.revolvePile ?? [] })}
            ><span className="text-text-muted">REVOLVE</span><b className="font-mono font-bold text-xs text-foe">×{opponent?.revolveCount ?? 0}</b></button>
            <div className="flex gap-1.5">
              <button
                onClick={toggleMute}
                title={muted ? "Unmute" : "Mute"}
                className="rounded-sm border-[2px] border-rim/60 px-1.5 py-0.5 text-[11px] text-text-muted shadow-panel-sm transition-colors hover:bg-neon/20 hover:text-neon"
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <button
                onClick={() => setShowFeed((v) => !v)}
                title="Toggle event log"
                className="rounded-sm border-[2px] border-rim/60 px-1.5 py-0.5 text-[11px] text-text-muted shadow-panel-sm transition-colors hover:bg-panel-mid"
              >
                📋
              </button>
            </div>
          </div>

          {/* ── Row 1 Col 0: Opponent Ace + HP ── */}
          {opponent && (
            <motion.div
              className="col-start-1 row-start-2 flex flex-col items-center justify-center gap-2 border-b-[2px] border-r-[2px] border-rim/60 px-2 py-2"
              variants={damageShakeVariants}
              animate={oppIsShaking ? "shake" : "idle"}
            >
              <AceSlot ace={opponent.ace} revolveCount={opponent.revolveCount} isMySlot={false} />
              <div className="rounded-sm border-[2px] border-foe/50 bg-panel px-4 py-1.5 shadow-glow-foe">
                <span className="font-mono text-2xl font-bold leading-none text-life-red">♥{opponent.life}</span>
              </div>
            </motion.div>
          )}

          {/* ── Row 1 Col 1: Opponent battlefield ── */}
          {displayedOpponent && (
            <div className="relative col-start-2 row-start-2 flex flex-col items-center justify-center gap-1 border-b-[2px] border-rim/60 px-3">
              <div className="pointer-events-none absolute inset-0 bg-battlefield-glow-foe" />
              <PlayerTargetZone
                droppableId="drop:player:opp"
                isTargetable={playerTargetable(opponentId)}
                onClick={() => handlePlayerClick(opponentId)}
              />
              <div className="flex justify-center gap-3">
                {displayedOpponent.battlefield.map((lane) => (
                  <LaneDropZone
                    key={lane.index}
                    lane={lane}
                    isMyLane={false}
                    acceptsDrop={laneAcceptsDrop(lane, false)}
                    isTargetable={!!lane.unit && isUnitTargetable(lane.unit)}
                    accent="foe"
                    onUnitClick={lane.unit ? () => handleUnitClick(lane.unit!) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Row 1 Col 2: Opponent InfuseZone (display only) ── */}
          <div className="col-start-3 row-start-2 flex items-center justify-center border-b-[2px] border-l-[2px] border-rim/60 px-2">
            <InfuseZone interactive={false} resourceCount={opponent?.temporaryResources} />
          </div>

          {/* ── Row 2 Col 1-2: Phase flow indicator ── */}
          <div className="col-start-1 col-span-2 row-start-3 flex flex-col items-center justify-center gap-0 px-4">
            <span className="font-impact text-[7px] uppercase tracking-[0.2em] text-text-muted2 mb-0.5">
              NEXUS DUEL INTERFACE
            </span>
            <div className="flex items-center gap-0.5">
              {PHASE_ORDER.map((phase, i) => {
                const isCurrent = gameState.phase === phase
                return (
                  <div key={phase} className="flex items-center gap-0.5">
                    {i > 0 && <span className="text-[8px] text-rim/60">•</span>}
                    <span className={[
                      "rounded-sm px-1.5 py-0.5 font-impact text-[9px] uppercase tracking-wide transition-all",
                      isCurrent
                        ? `${PHASE_COLOR[phase]} ${PHASE_BG[phase]} font-bold`
                        : "text-text-muted2/50",
                    ].join(" ")}>
                      {PHASE_SHORT[phase]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Row 2 Col 3: END MAIN button (also drop-to-infuse) ── */}
          <div
            ref={setInfuseMidRef}
            className={[
              "col-start-3 row-start-3 flex items-center justify-center border-l-[2px] px-2 transition-colors",
              isInfuseMidOver ? "border-neon bg-neon/10" : "border-rim/60",
            ].join(" ")}
          >
            {canAct && !isEndTurnSelect && (
              <button
                onClick={handleEndMainPhase}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-[2px] border-neon bg-panel font-impact text-[9px] uppercase leading-tight text-neon shadow-glow-neon animate-neon-ring transition-all hover:bg-neon/10"
              >
                <span className="block">END</span>
                <span className="block">MAIN</span>
              </button>
            )}
          </div>

          {/* ── Row 3 Col 0: My Ace + HP ── */}
          <motion.div
            className="col-start-1 row-start-4 flex flex-col items-center justify-center gap-2 border-r-[2px] border-t-[2px] border-rim/60 px-2 py-2"
            variants={damageShakeVariants}
            animate={meIsShaking ? "shake" : "idle"}
          >
            <AceSlot
              ace={me.ace}
              revolveCount={me.revolveCount}
              isMySlot={canAct}
              selected={me.ace != null && me.ace.instanceId === selectedCardId}
              {...(me.ace ? { onSelect: () => handleCardClick(me.ace!.instanceId) } : {})}
            />
            <div className="rounded-sm border-[2px] border-rim bg-panel px-4 py-1.5 shadow-panel-sm">
              <span className="font-mono text-2xl font-bold leading-none text-life-green">♥{me.life}</span>
            </div>
          </motion.div>

          {/* ── Row 3 Col 1: My battlefield ── */}
          <div className="relative col-start-2 row-start-4 flex flex-col items-center justify-center gap-1 border-t-[2px] border-rim/60 px-3">
            <div className="pointer-events-none absolute inset-0 bg-battlefield-glow" />
            <div className="flex justify-center gap-3">
              {displayedMe.battlefield.map((lane) => (
                <LaneDropZone
                  key={lane.index}
                  lane={lane}
                  isMyLane={true}
                  acceptsDrop={laneAcceptsDrop(lane, true)}
                  isTargetable={!!lane.unit && isUnitTargetable(lane.unit)}
                  onUnitClick={lane.unit ? () => handleUnitClick(lane.unit!) : undefined}
                  onAbilityClick={canAct ? handleAbilityClick : undefined}
                />
              ))}
            </div>
            <PlayerTargetZone
              droppableId="drop:player:me"
              isTargetable={playerTargetable(myPlayerId)}
              onClick={() => handlePlayerClick(myPlayerId)}
            />
          </div>

          {/* ── Row 3 Col 2: My InfuseZone ── */}
          <div className="col-start-3 row-start-4 flex items-center justify-center border-l-[2px] border-t-[2px] border-rim/60 px-2">
            <InfuseZone isActive={infuseActive} infuseValue={draggedInfuseVal} currentResources={me.temporaryResources} />
          </div>

          {/* ── Row 4 Col 0: My deck / pile info ── */}
          <div className="col-start-1 row-start-5 flex flex-col items-center justify-center gap-0.5 border-r-[2px] border-t-[2px] border-rim/60 px-2 py-1">
            <button
              className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/50 bg-panel/70 px-2 py-0.5 font-impact text-[9px] uppercase transition-all hover:bg-panel-mid hover:border-rim"
              onClick={() => setPileModal({ title: "My Deck", cards: me.deck })}
            ><span className="text-text-muted">DECK</span><b className="font-mono font-bold text-xs text-text-primary">{me.deck.length}</b></button>
            <div className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/20 bg-panel/40 px-2 py-0.5 font-impact text-[9px] uppercase">
              <span className="text-text-muted2">HAND</span><b className="font-mono font-bold text-xs text-text-primary">{myHand.length}</b>
            </div>
            <button
              className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/50 bg-panel/70 px-2 py-0.5 font-impact text-[9px] uppercase transition-all hover:bg-panel-mid hover:border-rim"
              onClick={() => setPileModal({ title: "My Discard", cards: me.discardPile })}
            ><span className="text-text-muted">DISCARD</span><b className="font-mono font-bold text-xs text-text-primary">{me.discardPile.length}</b></button>
          </div>

          {/* ── Row 4 Col 1: My hand ── */}
          <div className="col-start-2 row-start-5 flex items-center justify-center border-t-[2px] border-rim/60 px-2 py-1">
            <HandDisplay
              hand={myHand}
              onCardClick={handleCardClick}
              selectedId={isEndTurnSelect ? null : selectedCardId}
              selectedIds={isEndTurnSelect ? endTurnKeepIds : undefined}
              disabled={!canAct && !isEndTurnSelect}
            />
          </div>

          {/* ── Row 4 Col 2: Action buttons + turn HUD ── */}
          <div
            ref={setInfusePanelRef}
            className={[
              "col-start-3 row-start-5 flex flex-col items-center justify-center gap-1.5 border-l-[2px] border-t-[2px] px-2 py-1 transition-colors",
              isInfusePanelOver ? "border-neon bg-neon/10" : "border-rim/60",
            ].join(" ")}
          >
            {/* Revolve pile */}
            <button
              className="w-full flex items-center justify-between rounded-sm border-[1px] border-rim/50 bg-panel/70 px-2 py-0.5 font-impact text-[9px] uppercase transition-all hover:bg-panel-mid hover:border-rim"
              onClick={() => setPileModal({ title: "My Revolve", cards: me.revolvePile })}
            ><span className="text-text-muted">REVOLVE</span><b className="font-mono font-bold text-xs text-cyber-purple">×{me.revolveCount}</b></button>
            {/* Turn status */}
            <span
              className={
                isMyTurn
                  ? "rounded-sm border-[2px] border-neon bg-neon/10 px-2 py-0.5 font-impact text-xs uppercase tracking-tight text-neon animate-turn-pulse"
                  : "font-body text-xs text-text-muted"
              }
            >
              {isMyTurn ? "YOUR TURN" : "Waiting..."}
            </span>
            {/* Target mode */}
            {targetSel.state.mode !== "none" && (
              <>
                <span className="font-impact text-xs uppercase text-neon">
                  {targetSel.state.mode === "spell" ? "SELECT TARGET" : "SELECT ABILITY TARGET"}
                </span>
                <button
                  onClick={targetSel.cancel}
                  className="rounded-sm border-[2px] border-rim bg-life-red px-2 py-0.5 font-impact text-xs uppercase text-panel shadow-panel-sm transition-all hover:shadow-none"
                >
                  CANCEL
                </button>
              </>
            )}
            {/* Resources */}
            <div className="flex items-center gap-1.5">
              <span
                className="rounded-sm border-[2px] border-neon bg-neon/10 px-2.5 py-1 font-impact text-lg leading-none font-bold text-neon"
                style={{ boxShadow: me.temporaryResources > 0 ? '0 0 10px rgba(244,201,93,0.4)' : undefined }}
              >{me.temporaryResources}</span>
              <span className="font-mono text-[10px] text-text-muted2">res</span>
            </div>
            {/* Card actions */}
            {canAct && selectedCardId && !targetSel.needsExplicitTarget && (
              <button
                onClick={handleInfuse}
                className="rounded-sm border-[2px] border-neon bg-neon/15 px-3 py-1.5 font-impact text-xs uppercase text-neon shadow-glow-neon transition-all hover:shadow-none"
              >
                INFUSE {selCard ? `+${selCard.infuse}` : ""}
              </button>
            )}
            {canAct && isSelAoE && selectedCardId && (
              <button
                onClick={handleCastAoE}
                className="rounded-sm border-[2px] border-cyber-purple bg-cyber-purple/80 px-3 py-1.5 font-impact text-xs uppercase text-panel shadow-glow-cyber transition-all hover:shadow-none"
              >
                CAST SPELL
              </button>
            )}
            {targetSel.state.mode !== "none" && targetSel.needsExplicitTarget && (
              <p className="font-impact text-xs uppercase text-neon">→ CLICK TARGET</p>
            )}
            {/* END_TURN_SELECT: pick from hand */}
            {isEndTurnSelect && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-impact text-xs uppercase text-neon">KEEP UP TO 2</span>
                <span className="font-mono text-[9px] text-text-muted2">{endTurnKeepIds.length}/2 selected</span>
                <button
                  onClick={() => { handleEndTurnSelect(endTurnKeepIds); setEndTurnKeepIds([]) }}
                  className="rounded-sm border-[2px] border-rim bg-panel px-3 py-1.5 font-impact text-xs uppercase text-text-primary shadow-panel-sm transition-all hover:bg-panel-mid hover:shadow-none"
                >
                  CONFIRM ({endTurnKeepIds.length}/2)
                </button>
              </div>
            )}
            {canAct && !selectedCardId && targetSel.state.mode === "none" && !isDraggingCard && (
              <p className="text-center font-body text-[10px] text-text-muted2">Click or drag to play</p>
            )}
          </div>

        </LayoutGroup>

        {/* EventFeed slide-in panel */}
        <AnimatePresence>
          {showFeed && (
            <motion.div
              className="fixed bottom-0 right-0 top-0 z-40"
              variants={feedSlideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <EventFeed myPlayerId={myPlayerId} onClose={() => setShowFeed(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pile modal */}
        {pileModal && (
          <PileModal
            title={pileModal.title}
            cards={pileModal.cards}
            faceDown={!!pileModal.faceDown}
            onClose={() => setPileModal(null)}
          />
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {activeDrag && dragData?.cardId && (
            <CardView cardId={dragData.cardId} size="hand" />
          )}
        </DragOverlay>

        <PhaseBanner />
        <TurnIndicator myPlayerId={myPlayerId} />
        <GameOverCelebration
          winner={gameState.winner}
          isDraw={gameState.isDraw}
          myPlayerId={myPlayerId}
        />
      </div>
    </DndContext>
  )
}

