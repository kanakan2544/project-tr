import type { GameState, GameEvent, SummonUnitAction, UnitInstance, UnitCardData } from "@tcg/shared-types"
import { CardType, TriggerType } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { deepCloneState, getLane, getPlayer } from "../utils/state-helpers"
import { applySummonKeywords } from "./keyword-resolver"
import { evaluatePrimedAtSummon } from "./primed-system"
import { resolveTriggers } from "../effects/effect-trigger-system"

export function executeSummon(
  state: GameState,
  action: SummonUnitAction
): { nextState: GameState; events: GameEvent[] } {
  const current = deepCloneState(state)
  const events: GameEvent[] = []

  const player = getPlayer(current, action.playerId)

  const cardIdx = player.hand.findIndex((c) => c.instanceId === action.cardInstanceId)
  const isAceCard = cardIdx === -1 && player.ace?.instanceId === action.cardInstanceId

  const cardInstance = isAceCard ? player.ace! : player.hand[cardIdx]
  if (!cardInstance) throw new Error("Card not in hand or ace slot (should have been validated)")

  const cardData = getCard(cardInstance.cardId)
  if (cardData.type !== CardType.Unit) throw new Error("Not a unit card (should have been validated)")

  // Remove from the appropriate zone
  if (isAceCard) {
    player.ace = null
  } else {
    player.hand.splice(cardIdx, 1)
  }

  // Deduct cost
  player.temporaryResources -= cardData.cost

  const unit: UnitInstance = {
    instanceId: cardInstance.instanceId,
    cardId: cardInstance.cardId,
    owner: action.playerId,
    attack: cardData.attack,
    maxHealth: cardData.health,
    currentHealth: cardData.health,
    lane: action.targetLane,
    status: {
      standBy: true,
      exhausted: false,
      silenced: false,
      spellshieldActive: false,
      barrierActive: false,
    },
    keywords: [...(cardData.keywords ?? [])],
    flags: {},
    primedInfuseCount: cardInstance.primedInfuseCount,
    isPrimed: false,
    abilitiesUsedThisTurn: [],
    abilitiesUsedThisGame: [],
    grantedAbilities: [],
  }

  applySummonKeywords(unit)

  const lane = getLane(player, action.targetLane)
  lane.unit = unit

  // Evaluate primed condition at summon time (applies stats, sets isPrimed flag)
  evaluatePrimedAtSummon(unit, cardData as UnitCardData, player)
  if (unit.isPrimed) {
    events.push({ type: "UNIT_PRIMED", instanceId: unit.instanceId })
  }

  events.push({
    type: "UNIT_SUMMONED",
    instanceId: unit.instanceId,
    lane: action.targetLane,
    owner: action.playerId,
  })

  // ON_SUMMON triggers (includes primedEffects if isPrimed)
  const triggerResult = resolveTriggers(current, TriggerType.ON_SUMMON, unit.instanceId, action.playerId)
  return { nextState: triggerResult.nextState, events: [...events, ...triggerResult.events] }
}
