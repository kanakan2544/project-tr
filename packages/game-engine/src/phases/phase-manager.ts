import type { GameState, GameEvent } from "@tcg/shared-types"
import { Phase, TriggerType } from "@tcg/shared-types"
import { deepCloneState, getOpponentId, getPlayer } from "../utils/state-helpers"
import { drawCards } from "./draw-system"
import { resolveCombat } from "../combat/combat-resolver"
import { checkWinConditions } from "../core/win-condition-checker"
import { resolveTriggers } from "../effects/effect-trigger-system"

const TARGET_HAND_SIZE = 5

export function processStartTurn(state: GameState): { nextState: GameState; events: GameEvent[] } {
  const current = deepCloneState(state)
  const events: GameEvent[] = []

  events.push({ type: "TURN_STARTED", turn: current.turn, activePlayer: current.activePlayer })

  // Clear standBy on active player's units (they survived a full turn)
  const player = getPlayer(current, current.activePlayer)
  for (const lane of player.battlefield) {
    if (lane.unit) {
      lane.unit.status.standBy = false
      lane.unit.abilitiesUsedThisTurn = []
    }
  }

  current.phase = Phase.MAIN_PHASE
  events.push({ type: "PHASE_CHANGED", from: Phase.START_TURN, to: Phase.MAIN_PHASE })

  // START_TURN triggers for active player's units
  const triggerResult = resolveTriggers(current, TriggerType.START_TURN, null, current.activePlayer)
  return { nextState: triggerResult.nextState, events: [...events, ...triggerResult.events] }
}

export function processEndMainPhase(state: GameState): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const allEvents: GameEvent[] = []

  current.phase = Phase.ATTACK_PHASE
  allEvents.push({ type: "PHASE_CHANGED", from: Phase.MAIN_PHASE, to: Phase.ATTACK_PHASE })

  // Auto-resolve combat
  const combatResult = resolveCombat(current)
  current = combatResult.nextState
  allEvents.push(...combatResult.events)

  if (current.winner !== null || current.isDraw) {
    return { nextState: current, events: allEvents }
  }

  // Transition to END_TURN_SELECT or END_TURN depending on hand size
  const activePlayer = getPlayer(current, current.activePlayer)
  if (activePlayer.hand.length > 2) {
    current.phase = Phase.END_TURN_SELECT
    allEvents.push({ type: "PHASE_CHANGED", from: Phase.ATTACK_PHASE, to: Phase.END_TURN_SELECT })
    allEvents.push({ type: "END_TURN_SELECT_REQUIRED", playerId: current.activePlayer, handSize: activePlayer.hand.length })
  } else {
    const endResult = processEndTurn(current)
    current = endResult.nextState
    allEvents.push(...endResult.events)
  }

  return { nextState: current, events: allEvents }
}

export function processEndTurn(state: GameState): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const allEvents: GameEvent[] = []

  const activePlayerId = current.activePlayer

  // END_TURN triggers before draw
  const endTriggerResult = resolveTriggers(current, TriggerType.END_TURN, null, activePlayerId)
  current = endTriggerResult.nextState
  allEvents.push(...endTriggerResult.events)

  if (current.winner !== null || current.isDraw) {
    return { nextState: current, events: allEvents }
  }

  // Reset resources
  getPlayer(current, activePlayerId).temporaryResources = 0

  allEvents.push({ type: "TURN_ENDED", turn: current.turn })

  // Draw until hand = 5
  const cardsToDraw = TARGET_HAND_SIZE - getPlayer(current, activePlayerId).hand.length
  if (cardsToDraw > 0) {
    const drawResult = drawCards(current, activePlayerId, cardsToDraw)
    current = drawResult.nextState
    allEvents.push(...drawResult.events)
  }

  if (current.winner !== null || current.isDraw) {
    return { nextState: current, events: allEvents }
  }

  // Switch active player
  const nextPlayerId = getOpponentId(current, activePlayerId)
  current.activePlayer = nextPlayerId
  current.turn++

  // Start next player's turn
  current.phase = Phase.START_TURN
  const startResult = processStartTurn(current)
  current = startResult.nextState
  allEvents.push(...startResult.events)

  return { nextState: current, events: allEvents }
}
