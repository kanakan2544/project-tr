import type { GameState, GameEvent, CastSpellAction, TriggeredAbility } from "@tcg/shared-types"
import { CardType, EffectConditionType, TriggerType, TargetType } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { deepCloneState, findUnitOnBattlefield, getOpponentId, getPlayer } from "../utils/state-helpers"
import { applyEffect } from "../effects/effect-applicator"
import { resolveTarget, resolveAllTargets } from "../effects/target-resolver"

function countBattlefieldUnits(state: GameState, ownerId: string): number {
  return getPlayer(state, ownerId).battlefield.filter((l) => l.unit !== null).length
}

export function executeCastSpell(
  state: GameState,
  action: CastSpellAction
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []

  const player = getPlayer(current, action.playerId)
  const cardIdx = player.hand.findIndex((c) => c.instanceId === action.cardInstanceId)
  const cardInstance = player.hand[cardIdx]
  if (!cardInstance) throw new Error("Card not in hand (should have been validated)")

  const cardData = getCard(cardInstance.cardId)
  if (cardData.type !== CardType.Spell) throw new Error("Not a spell (should have been validated)")

  // Remove from hand
  player.hand.splice(cardIdx, 1)

  // Deduct cost
  player.temporaryResources -= cardData.cost

  // Collect ON_PLAY triggered abilities
  const onPlayAbilities = (cardData.abilities ?? []).filter(
    (a): a is TriggeredAbility => a.kind === "triggered" && a.trigger === TriggerType.ON_PLAY
  )

  for (const ability of onPlayAbilities) {
    // Check conditions (e.g. CONTROLS_X_UNITS)
    const conditionsMet = (ability.conditions ?? []).every((c) => {
      if (c.type === EffectConditionType.SELF_IS_PRIMED) return false
      if (c.type === EffectConditionType.CONTROLS_X_UNITS) {
        return countBattlefieldUnits(current, action.playerId) >= c.value
      }
      return true
    })
    if (!conditionsMet) continue

    for (const abilityAction of ability.actions) {
      const target = "target" in abilityAction ? abilityAction.target : undefined

      // Spellshield check — only for enemy-unit targeting effects
      if (
        action.targetInstanceId &&
        (target === TargetType.ENEMY_UNIT || target === TargetType.ANY_UNIT)
      ) {
        const opponentId = getOpponentId(current, action.playerId)
        const opponent = getPlayer(current, opponentId)
        const targetUnit = findUnitOnBattlefield(opponent, action.targetInstanceId)
        if (targetUnit && targetUnit.status.spellshieldActive) {
          targetUnit.status.spellshieldActive = false
          events.push({ type: "SPELLSHIELD_NEGATED", instanceId: action.targetInstanceId })
          continue
        }
      }

      if (
        target === TargetType.ALL_UNITS ||
        target === TargetType.ALL_ENEMY_UNITS ||
        target === TargetType.ALL_ALLY_UNITS
      ) {
        const targets = resolveAllTargets(current, target, action.playerId)
        for (const t of targets) {
          const result = applyEffect(
            current, abilityAction, TriggerType.ON_PLAY, null, action.playerId,
            t.unitInstanceId, t.playerId
          )
          current = result.nextState
          events.push(...result.events)
          if (current.winner !== null || current.isDraw) break
        }
      } else {
        const resolved = target
          ? resolveTarget(
              current, target, null, action.playerId,
              action.targetInstanceId, action.targetPlayerId
            )
          : { unitInstanceId: undefined, playerId: undefined }
        if (!resolved && target) continue
        const result = applyEffect(
          current, abilityAction, TriggerType.ON_PLAY, null, action.playerId,
          resolved?.unitInstanceId, resolved?.playerId
        )
        current = result.nextState
        events.push(...result.events)
      }

      if (current.winner !== null || current.isDraw) break
    }

    if (current.winner !== null || current.isDraw) break
  }

  // Move spell to discard pile
  const freshPlayer = getPlayer(current, action.playerId)
  freshPlayer.discardPile.push(cardInstance)

  return { nextState: current, events }
}
