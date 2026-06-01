import type { GameState, GameEvent, ActivateAbilityAction, ActivatedAbility } from "@tcg/shared-types"
import { CardType, TriggerType, TargetType } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { deepCloneState, findUnitOnBattlefield, getPlayer } from "../utils/state-helpers"
import { resolveTarget, resolveAllTargets } from "../effects/target-resolver"
import { applyEffect } from "../effects/effect-applicator"

export function executeActivateAbility(
  state: GameState,
  action: ActivateAbilityAction
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []

  const player = getPlayer(current, action.playerId)
  const unit = findUnitOnBattlefield(player, action.unitInstanceId)
  if (!unit) throw new Error("Unit not found (should have been validated)")

  const cardData = getCard(unit.cardId)
  if (cardData.type !== CardType.Unit) throw new Error("Not a unit card (should have been validated)")

  const activatedAbilities = (cardData.abilities ?? []).filter(
    (a): a is ActivatedAbility => a.kind === "activated"
  )
  const ability = activatedAbilities[action.abilityIndex]
  if (!ability) throw new Error("Ability not found (should have been validated)")

  // Deduct cost
  player.temporaryResources -= ability.activationCost

  // Mark ability as used this turn / this game
  unit.abilitiesUsedThisTurn.push(action.abilityIndex)
  if (ability.oncePerGame) unit.abilitiesUsedThisGame.push(action.abilityIndex)

  for (const abilityAction of ability.actions) {
    const target = "target" in abilityAction ? abilityAction.target : undefined

    if (target === TargetType.ALL_UNITS || target === TargetType.ALL_ENEMY_UNITS) {
      const targets = resolveAllTargets(current, target, action.playerId)
      for (const t of targets) {
        const result = applyEffect(current, abilityAction, TriggerType.ON_PLAY, unit.instanceId, action.playerId, t.unitInstanceId, t.playerId)
        current = result.nextState
        events.push(...result.events)
        if (current.winner !== null || current.isDraw) break
      }
    } else {
      const resolved = target
        ? resolveTarget(current, target, unit.instanceId, action.playerId, action.targetInstanceId, action.targetPlayerId)
        : { unitInstanceId: undefined, playerId: undefined }
      if (resolved || !target) {
        const result = applyEffect(current, abilityAction, TriggerType.ON_PLAY, unit.instanceId, action.playerId, resolved?.unitInstanceId, resolved?.playerId)
        current = result.nextState
        events.push(...result.events)
      }
    }
  }

  events.push({ type: "ABILITY_ACTIVATED", unitInstanceId: unit.instanceId, abilityIndex: action.abilityIndex })

  return { nextState: current, events }
}
