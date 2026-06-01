import type { GameState, GameEvent, UnitInstance, PlayerId, PlayerState, TriggeredAbility } from "@tcg/shared-types"
import { PrimedConditionType, TriggerType, EffectConditionType, TargetType } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { UnitCardData } from "@tcg/shared-types"
import { deepCloneState, getPlayer } from "../utils/state-helpers"
import { applyEffect } from "../effects/effect-applicator"
import { resolveTarget, resolveAllTargets } from "../effects/target-resolver"

function meetsCondition(unit: UnitInstance, cardData: UnitCardData, player: PlayerState): boolean {
  if (!cardData.primedCondition) return false
  const { type, value } = cardData.primedCondition
  switch (type) {
    case PrimedConditionType.INFUSED_X_TIMES:
      return unit.primedInfuseCount >= value
    case PrimedConditionType.REVOLVED_X_TIMES:
      return player.revolveCount >= value
  }
}

function applyPrimedBonuses(unit: UnitInstance, cardData: UnitCardData): void {
  if (cardData.primedStats) {
    if (cardData.primedStats.attack) unit.attack += cardData.primedStats.attack
    if (cardData.primedStats.health) {
      unit.maxHealth += cardData.primedStats.health
      unit.currentHealth += cardData.primedStats.health
    }
  }
  if (cardData.primedKeywords) {
    for (const kw of cardData.primedKeywords) {
      if (!unit.keywords.includes(kw)) unit.keywords.push(kw)
    }
  }
}

// Called at summon time — sets isPrimed + applies primedStats if condition met
// Primed triggered abilities fire naturally when resolveTriggers(ON_SUMMON) runs after this
export function evaluatePrimedAtSummon(
  unit: UnitInstance,
  cardData: UnitCardData,
  player: PlayerState
): void {
  if (unit.isPrimed) return
  if (!meetsCondition(unit, cardData, player)) return

  unit.isPrimed = true
  applyPrimedBonuses(unit, cardData)
}

// Called mid-battlefield when an infuse or revolve may trigger primed condition
export function evaluateBattlefieldPrimed(
  state: GameState,
  playerId: PlayerId,
  triggerType: TriggerType.ON_INFUSE | TriggerType.ON_REVOLVE
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const allEvents: GameEvent[] = []

  const player = getPlayer(current, playerId)

  for (const lane of player.battlefield) {
    const unit = lane.unit
    if (!unit || unit.isPrimed) continue

    const cardData = getCard(unit.cardId)
    if (cardData.type !== "Unit") continue

    if (!meetsCondition(unit, cardData, player)) continue

    unit.isPrimed = true
    applyPrimedBonuses(unit, cardData)
    allEvents.push({ type: "UNIT_PRIMED", instanceId: unit.instanceId })

    // Fire primed-condition abilities (trigger ON_SUMMON always fires; current trigger also fires)
    const primedAbilities = (cardData.abilities ?? []).filter(
      (a): a is TriggeredAbility =>
        a.kind === "triggered" &&
        (a.conditions ?? []).some((c) => c.type === EffectConditionType.SELF_IS_PRIMED) &&
        (a.trigger === triggerType || a.trigger === TriggerType.ON_SUMMON)
    )

    for (const ability of primedAbilities) {
      for (const action of ability.actions) {
        const target = "target" in action ? action.target : undefined

        if (target === TargetType.ALL_UNITS || target === TargetType.ALL_ENEMY_UNITS) {
          const targets = resolveAllTargets(current, target, playerId)
          for (const t of targets) {
            const result = applyEffect(current, action, ability.trigger, unit.instanceId, playerId, t.unitInstanceId, t.playerId)
            current = result.nextState
            allEvents.push(...result.events)
          }
        } else {
          const resolved = target
            ? resolveTarget(current, target, unit.instanceId, playerId)
            : { unitInstanceId: undefined, playerId: undefined }
          if (!resolved && target) continue
          const result = applyEffect(current, action, ability.trigger, unit.instanceId, playerId, resolved?.unitInstanceId, resolved?.playerId)
          current = result.nextState
          allEvents.push(...result.events)
        }
      }
    }
  }

  return { nextState: current, events: allEvents }
}
