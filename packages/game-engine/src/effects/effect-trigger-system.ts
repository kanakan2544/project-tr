import type { GameState, GameEvent, PlayerId, UnitInstance, AbilityCondition, TriggeredAbility } from "@tcg/shared-types"
import { TriggerType, TargetType, EffectConditionType, Keyword } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { getAdjacentLanes, getOpponentId, getPlayer, getUnitInLane, findUnitOnBattlefield } from "../utils/state-helpers"
import { hasKeyword } from "../systems/keyword-resolver"
import { applyEffect } from "./effect-applicator"
import { resolveTarget, resolveAllTargets } from "./target-resolver"

function countBattlefieldUnits(state: GameState, ownerId: PlayerId): number {
  return getPlayer(state, ownerId).battlefield.filter((l) => l.unit !== null).length
}

export interface ResolveTriggerOptions {
  attackingPlayerId?: PlayerId
  explicitTargetInstanceId?: string
  explicitTargetPlayerId?: PlayerId
  destroyedCardId?: string
  destroyedOwner?: PlayerId
  destroyedIsPrimed?: boolean
}

interface TriggerSource {
  cardId: string
  instanceId: string
  ownerId: PlayerId
  laneIndex: number
  isDefender: boolean
  isPrimed: boolean
}

function checkAbilityConditions(
  conditions: readonly AbilityCondition[] | undefined,
  isPrimed: boolean,
  state?: GameState,
  ownerId?: PlayerId
): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every((c) => {
    if (c.type === EffectConditionType.SELF_IS_PRIMED) return isPrimed
    if (c.type === EffectConditionType.CONTROLS_X_UNITS) {
      if (!state || !ownerId) return false
      return countBattlefieldUnits(state, ownerId) >= c.value
    }
    return true
  })
}

function isLonesomeViolated(state: GameState, ownerId: PlayerId, laneIndex: number): boolean {
  const player = getPlayer(state, ownerId)
  for (const adjLane of getAdjacentLanes(laneIndex)) {
    if (getUnitInLane(player, adjLane)) return true
  }
  return false
}

export function resolveTriggers(
  state: GameState,
  trigger: TriggerType,
  sourceInstanceId: string | null,
  sourceOwner: PlayerId,
  options: ResolveTriggerOptions = {}
): { nextState: GameState; events: GameEvent[] } {
  let current = state
  const allEvents: GameEvent[] = []

  const sources = collectTriggerSources(current, trigger, sourceInstanceId, sourceOwner, options)

  for (const src of sources) {
    const cardData = getCard(src.cardId)
    if (cardData.type !== "Unit") continue

    // Lonesome: skip all abilities if unit has an adjacent ally
    const liveUnit = findUnitOnBattlefield(getPlayer(current, src.ownerId), src.instanceId)
    if (liveUnit && hasKeyword(liveUnit, Keyword.Lonesome) && isLonesomeViolated(current, src.ownerId, liveUnit.lane)) {
      continue
    }

    const allAbilities: TriggeredAbility[] = [
      ...((cardData.abilities ?? []).filter((a): a is TriggeredAbility => a.kind === "triggered")),
      ...(liveUnit?.grantedAbilities ?? []),
    ].filter(
      (a) =>
        a.trigger === trigger &&
        checkAbilityConditions(a.conditions, src.isPrimed, current, src.ownerId)
    )

    for (const ability of allAbilities) {
      for (const action of ability.actions) {
        const target = "target" in action ? action.target : undefined

        if (
          target === TargetType.ALL_UNITS ||
          target === TargetType.ALL_ENEMY_UNITS ||
          target === TargetType.ALL_ALLY_UNITS
        ) {
          const targets = resolveAllTargets(current, target, src.ownerId)
          for (const t of targets) {
            const result = applyEffect(
              current, action, trigger, src.instanceId, src.ownerId,
              t.unitInstanceId, t.playerId
            )
            current = result.nextState
            allEvents.push(...result.events)
            if (current.winner !== null || current.isDraw) return { nextState: current, events: allEvents }
          }
        } else {
          const resolved = target
            ? resolveTarget(
                current, target, src.instanceId, src.ownerId,
                options.explicitTargetInstanceId, options.explicitTargetPlayerId
              )
            : { unitInstanceId: undefined, playerId: undefined }
          if (!resolved && target) continue
          const result = applyEffect(
            current, action, trigger, src.instanceId, src.ownerId,
            resolved?.unitInstanceId, resolved?.playerId
          )
          current = result.nextState
          allEvents.push(...result.events)
          if (current.winner !== null || current.isDraw) return { nextState: current, events: allEvents }
        }
      }
    }
  }

  return { nextState: current, events: allEvents }
}

function collectTriggerSources(
  state: GameState,
  trigger: TriggerType,
  sourceInstanceId: string | null,
  sourceOwner: PlayerId,
  options: ResolveTriggerOptions
): TriggerSource[] {
  if (trigger === TriggerType.ON_DESTROY) {
    if (!options.destroyedCardId || !options.destroyedOwner) return []
    const cardData = getCard(options.destroyedCardId)
    if (cardData.type !== "Unit") return []
    const isPrimed = options.destroyedIsPrimed ?? false
    const destroyedInstanceId = sourceInstanceId ?? options.destroyedCardId
    const hasDestroyAbilities =
      (cardData.abilities ?? []).some(
        (a): a is TriggeredAbility =>
          a.kind === "triggered" &&
          a.trigger === TriggerType.ON_DESTROY &&
          checkAbilityConditions(a.conditions, isPrimed, state, options.destroyedOwner)
      )
    if (!hasDestroyAbilities) return []
    return [{
      cardId: options.destroyedCardId,
      instanceId: destroyedInstanceId,
      ownerId: options.destroyedOwner,
      laneIndex: 0,
      isDefender: false,
      isPrimed,
    }]
  }

  if (
    trigger === TriggerType.ON_SUMMON ||
    trigger === TriggerType.ON_ATTACK ||
    trigger === TriggerType.ON_DAMAGE ||
    trigger === TriggerType.ON_KILL ||
    trigger === TriggerType.ON_HIT ||
    trigger === TriggerType.ON_INFUSE ||
    trigger === TriggerType.ON_REVOLVE
  ) {
    if (!sourceInstanceId) return []
    const ownerPlayer = getPlayer(state, sourceOwner)
    for (const lane of ownerPlayer.battlefield) {
      if (lane.unit?.instanceId === sourceInstanceId) {
        const unit = lane.unit
        const cardData = getCard(unit.cardId)
        if (cardData.type !== "Unit") return []
        if (unit.status.silenced) return []
        const allUnitAbilities: TriggeredAbility[] = [
          ...((cardData.abilities ?? []).filter((a): a is TriggeredAbility => a.kind === "triggered")),
          ...(unit.grantedAbilities ?? []),
        ]
        const hasMatchingAbilities = allUnitAbilities.some(
          (a) => a.trigger === trigger && checkAbilityConditions(a.conditions, unit.isPrimed, state, sourceOwner)
        )
        if (!hasMatchingAbilities) return []
        return [{
          cardId: unit.cardId,
          instanceId: unit.instanceId,
          ownerId: sourceOwner,
          laneIndex: lane.index,
          isDefender: false,
          isPrimed: unit.isPrimed,
        }]
      }
    }
    return []
  }

  if (trigger === TriggerType.START_TURN || trigger === TriggerType.END_TURN) {
    return collectBattlefieldSources(state, sourceOwner, trigger, options.attackingPlayerId)
  }

  return []
}

function collectBattlefieldSources(
  state: GameState,
  activePlayerId: PlayerId,
  trigger: TriggerType,
  attackingPlayerId?: PlayerId
): TriggerSource[] {
  const sources: TriggerSource[] = []
  const defenderPlayerId = attackingPlayerId
    ? getOpponentId(state, attackingPlayerId)
    : activePlayerId
  const attackerPlayerId = attackingPlayerId ?? activePlayerId

  const playerIds = [defenderPlayerId, attackerPlayerId]

  for (const pid of playerIds) {
    const isDefender = pid === defenderPlayerId
    const player = getPlayer(state, pid)
    const unitsWithAbilities: { unit: UnitInstance; laneIndex: number }[] = []

    for (const lane of player.battlefield) {
      if (!lane.unit) continue
      const unit = lane.unit
      if (unit.status.silenced) continue
      const cardData = getCard(unit.cardId)
      if (cardData.type !== "Unit") continue
      const allUnitAbilities2: TriggeredAbility[] = [
        ...((cardData.abilities ?? []).filter((a): a is TriggeredAbility => a.kind === "triggered")),
        ...(unit.grantedAbilities ?? []),
      ]
      const hasAbilities = allUnitAbilities2.some(
        (a) => a.trigger === trigger && checkAbilityConditions(a.conditions, unit.isPrimed, state, pid)
      )
      if (hasAbilities) unitsWithAbilities.push({ unit, laneIndex: lane.index })
    }

    unitsWithAbilities.sort((a, b) => a.laneIndex - b.laneIndex)

    for (const { unit, laneIndex } of unitsWithAbilities) {
      sources.push({
        cardId: unit.cardId,
        instanceId: unit.instanceId,
        ownerId: pid,
        laneIndex,
        isDefender,
        isPrimed: unit.isPrimed,
      })
    }
  }

  return sources
}
