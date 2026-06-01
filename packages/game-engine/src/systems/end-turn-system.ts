import type { GameState, GameEvent, EndTurnSelectAction } from "@tcg/shared-types"
import { Phase } from "@tcg/shared-types"
import { deepCloneState, getPlayer } from "../utils/state-helpers"
import { processEndTurn } from "../phases/phase-manager"

export function executeEndTurnSelect(
  state: GameState,
  action: EndTurnSelectAction
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const allEvents: GameEvent[] = []

  const player = getPlayer(current, action.playerId)
  const keepSet = new Set(action.keepInstanceIds)

  // Move non-kept cards to revolve pile
  const kept = player.hand.filter((c) => keepSet.has(c.instanceId))
  const discarded = player.hand.filter((c) => !keepSet.has(c.instanceId))

  player.hand = kept
  for (const card of discarded) {
    player.revolvePile.push(card)
  }

  // Transition to END_TURN and process it
  current.phase = Phase.END_TURN
  allEvents.push({ type: "PHASE_CHANGED", from: Phase.END_TURN_SELECT, to: Phase.END_TURN })

  const endResult = processEndTurn(current)
  current = endResult.nextState
  allEvents.push(...endResult.events)

  return { nextState: current, events: allEvents }
}
