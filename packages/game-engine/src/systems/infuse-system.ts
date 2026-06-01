import type { GameState, GameEvent, InfuseCardAction } from "@tcg/shared-types"
import { TriggerType, CardType } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { deepCloneState, findCardInHand, getPlayer } from "../utils/state-helpers"
import { evaluateBattlefieldPrimed } from "./primed-system"
import { resolveTriggers } from "../effects/effect-trigger-system"

export function executeInfuse(
  state: GameState,
  action: InfuseCardAction
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []

  const player = getPlayer(current, action.playerId)
  const cardIdx = player.hand.findIndex((c) => c.instanceId === action.cardInstanceId)
  const cardInstance = player.hand[cardIdx]
  if (!cardInstance) throw new Error("Card not in hand (should have been validated)")

  const cardData = getCard(cardInstance.cardId)

  // Remove from hand
  player.hand.splice(cardIdx, 1)

  // Compute effective infuse value using bonus accumulated from prior infuses
  const effectiveInfuseValue = cardData.infuse + cardInstance.infuseValueBonus

  // Add resources
  player.temporaryResources += effectiveInfuseValue

  // Increment primed counter on instance before moving
  cardInstance.primedInfuseCount++

  // Units permanently gain +1 infuse value (max +3 bonus)
  if (cardData.type === CardType.Unit && cardInstance.infuseValueBonus < 3) {
    cardInstance.infuseValueBonus++
  }

  // Move to revolve pile
  player.revolvePile.push(cardInstance)

  events.push({
    type: "CARD_INFUSED",
    instanceId: action.cardInstanceId,
    resourcesGenerated: effectiveInfuseValue,
  })

  // Check if any battlefield units just met their primed condition
  const primedResult = evaluateBattlefieldPrimed(current, action.playerId, TriggerType.ON_INFUSE)
  current = primedResult.nextState
  events.push(...primedResult.events)

  // Fire ON_INFUSE triggers on battlefield units
  const triggerResult = resolveTriggers(current, TriggerType.ON_INFUSE, action.cardInstanceId, action.playerId)
  return { nextState: triggerResult.nextState, events: [...events, ...triggerResult.events] }
}
