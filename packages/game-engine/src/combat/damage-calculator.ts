import type { GameState, GameEvent, UnitInstance } from "@tcg/shared-types"
import { Keyword, TriggerType } from "@tcg/shared-types"
import { deepCloneState, findUnitOnBattlefield, getOpponentId, getPlayer } from "../utils/state-helpers"
import { checkWinConditions } from "../core/win-condition-checker"
import { hasKeyword } from "../systems/keyword-resolver"
import { destroyUnit } from "../utils/unit-lifecycle"
import { resolveTriggers } from "../effects/effect-trigger-system"

function applyBarrier(unit: UnitInstance, events: GameEvent[]): boolean {
  if (!unit.status.barrierActive) return false
  unit.status.barrierActive = false
  events.push({ type: "BARRIER_BROKEN", instanceId: unit.instanceId })
  return true
}

export function resolveUnitVsUnit(
  state: GameState,
  attacker: UnitInstance,
  attackerId: string,
  defender: UnitInstance,
  defenderId: string
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []

  // Re-reference units after clone
  let liveAttacker = findUnitOnBattlefield(getPlayer(current, attackerId), attacker.instanceId)
  let liveDefender = findUnitOnBattlefield(getPlayer(current, defenderId), defender.instanceId)
  if (!liveAttacker || !liveDefender) return { nextState: current, events }

  const attackDamage = liveAttacker.attack
  const defenderCounterDamage = liveDefender.attack
  const attackerHasQuickAttack = hasKeyword(liveAttacker, Keyword.QuickAttack)
  const attackerHasPiercing = hasKeyword(liveAttacker, Keyword.Piercing)

  if (attackerHasQuickAttack) {
    // QuickAttack: attacker strikes first; if defender dies, no counter-attack
    const defBarrierBlocked = applyBarrier(liveDefender, events)
    if (!defBarrierBlocked) {
      liveDefender.currentHealth -= attackDamage
      events.push({ type: "UNIT_DAMAGED", instanceId: liveDefender.instanceId, damage: attackDamage, remainingHealth: liveDefender.currentHealth, attackerInstanceId: liveAttacker.instanceId })

      if ((hasKeyword(liveAttacker, Keyword.Overkill) || attackerHasPiercing) && liveDefender.currentHealth < 0) {
        const excess = Math.abs(liveDefender.currentHealth)
        const defPlayer = getPlayer(current, defenderId)
        defPlayer.life -= excess
        events.push({ type: "PLAYER_DAMAGED", playerId: defenderId, damage: excess, remainingLife: defPlayer.life })
        current = checkWinConditions(current)
      }
    }

    if (liveDefender.currentHealth <= 0) {
      // Defender died — no counter-attack
      const destroyedCardId = liveDefender.cardId
      const destroyedIsPrimed = liveDefender.isPrimed
      destroyUnit(current, liveDefender, defenderId, events)
      current = checkWinConditions(current)

      if (!(current.winner !== null || current.isDraw)) {
        // ON_KILL for attacker
        const onKillResult = resolveTriggers(current, TriggerType.ON_KILL, liveAttacker.instanceId, attackerId, { attackingPlayerId: attackerId })
        current = onKillResult.nextState
        events.push(...onKillResult.events)

        const onDestroyResult = resolveTriggers(current, TriggerType.ON_DESTROY, liveDefender.instanceId, defenderId, {
          attackingPlayerId: attackerId,
          destroyedCardId,
          destroyedOwner: defenderId,
          destroyedIsPrimed,
        })
        current = onDestroyResult.nextState
        events.push(...onDestroyResult.events)
      }
    } else {
      // Defender survived — counter-attack
      liveAttacker = findUnitOnBattlefield(getPlayer(current, attackerId), attacker.instanceId)!
      const atkBarrierBlocked = applyBarrier(liveAttacker, events)
      if (!atkBarrierBlocked) {
        liveAttacker.currentHealth -= defenderCounterDamage
        events.push({ type: "UNIT_DAMAGED", instanceId: liveAttacker.instanceId, damage: defenderCounterDamage, remainingHealth: liveAttacker.currentHealth, attackerInstanceId: liveDefender.instanceId })
      }

      if (hasKeyword(liveAttacker, Keyword.Lifesteal)) {
        const attPlayer = getPlayer(current, attackerId)
        attPlayer.life += attackDamage
        events.push({ type: "PLAYER_HEALED", playerId: attackerId, amount: attackDamage, newLife: attPlayer.life })
      }

      // ON_ATTACK trigger for attacker
      const onAttackResult = resolveTriggers(current, TriggerType.ON_ATTACK, liveAttacker.instanceId, attackerId, { attackingPlayerId: attackerId })
      current = onAttackResult.nextState
      events.push(...onAttackResult.events)

      // Death checks
      const finalAttacker = findUnitOnBattlefield(getPlayer(current, attackerId), liveAttacker.instanceId)
      if (finalAttacker && finalAttacker.currentHealth <= 0) {
        const destroyedCardId = finalAttacker.cardId
        const destroyedIsPrimed = finalAttacker.isPrimed
        destroyUnit(current, finalAttacker, attackerId, events)
        current = checkWinConditions(current)
        if (!(current.winner !== null || current.isDraw)) {
          const onDestroyResult = resolveTriggers(current, TriggerType.ON_DESTROY, finalAttacker.instanceId, attackerId, {
            attackingPlayerId: attackerId,
            destroyedCardId,
            destroyedOwner: attackerId,
            destroyedIsPrimed,
          })
          current = onDestroyResult.nextState
          events.push(...onDestroyResult.events)
        }
      }
    }
  } else {
    // Simultaneous damage
    const defBarrierBlocked = applyBarrier(liveDefender, events)
    const atkBarrierBlocked = applyBarrier(liveAttacker, events)

    if (!defBarrierBlocked) {
      liveDefender.currentHealth -= attackDamage
      events.push({ type: "UNIT_DAMAGED", instanceId: liveDefender.instanceId, damage: attackDamage, remainingHealth: liveDefender.currentHealth, attackerInstanceId: liveAttacker.instanceId })
    }
    if (!atkBarrierBlocked) {
      liveAttacker.currentHealth -= defenderCounterDamage
      events.push({ type: "UNIT_DAMAGED", instanceId: liveAttacker.instanceId, damage: defenderCounterDamage, remainingHealth: liveAttacker.currentHealth, attackerInstanceId: liveDefender.instanceId })
    }

    // Overkill / Piercing: excess damage to defending player
    if ((hasKeyword(liveAttacker, Keyword.Overkill) || attackerHasPiercing) && liveDefender.currentHealth < 0) {
      const excess = Math.abs(liveDefender.currentHealth)
      const defPlayer = getPlayer(current, defenderId)
      defPlayer.life -= excess
      events.push({ type: "PLAYER_DAMAGED", playerId: defenderId, damage: excess, remainingLife: defPlayer.life })
      current = checkWinConditions(current)
    }

    // Lifesteal: heal attacker's controller
    if (hasKeyword(liveAttacker, Keyword.Lifesteal)) {
      const attPlayer = getPlayer(current, attackerId)
      attPlayer.life += attackDamage
      events.push({ type: "PLAYER_HEALED", playerId: attackerId, amount: attackDamage, newLife: attPlayer.life })
    }

    // ON_ATTACK trigger for attacker
    const onAttackResult = resolveTriggers(current, TriggerType.ON_ATTACK, liveAttacker.instanceId, attackerId, { attackingPlayerId: attackerId })
    current = onAttackResult.nextState
    events.push(...onAttackResult.events)

    // ON_DAMAGE trigger for defender (re-fetch in case state changed)
    const freshDefender = findUnitOnBattlefield(getPlayer(current, defenderId), liveDefender.instanceId)
    if (freshDefender && freshDefender.currentHealth < freshDefender.maxHealth) {
      const onDamageResult = resolveTriggers(current, TriggerType.ON_DAMAGE, freshDefender.instanceId, defenderId, { attackingPlayerId: attackerId })
      current = onDamageResult.nextState
      events.push(...onDamageResult.events)
    }

    // Death checks (defender first per rules)
    const finalDefender = findUnitOnBattlefield(getPlayer(current, defenderId), liveDefender.instanceId)
    const finalAttacker = findUnitOnBattlefield(getPlayer(current, attackerId), liveAttacker.instanceId)

    if (finalDefender && finalDefender.currentHealth <= 0) {
      const destroyedCardId = finalDefender.cardId
      const destroyedIsPrimed = finalDefender.isPrimed
      destroyUnit(current, finalDefender, defenderId, events)
      current = checkWinConditions(current)
      if (!(current.winner !== null || current.isDraw)) {
        const onKillResult = resolveTriggers(current, TriggerType.ON_KILL, liveAttacker.instanceId, attackerId, { attackingPlayerId: attackerId })
        current = onKillResult.nextState
        events.push(...onKillResult.events)

        const onDestroyResult = resolveTriggers(current, TriggerType.ON_DESTROY, finalDefender.instanceId, defenderId, {
          attackingPlayerId: attackerId,
          destroyedCardId,
          destroyedOwner: defenderId,
          destroyedIsPrimed,
        })
        current = onDestroyResult.nextState
        events.push(...onDestroyResult.events)
      }
    }

    if (finalAttacker && finalAttacker.currentHealth <= 0) {
      const destroyedCardId = finalAttacker.cardId
      const destroyedIsPrimed = finalAttacker.isPrimed
      destroyUnit(current, finalAttacker, attackerId, events)
      current = checkWinConditions(current)
      if (!(current.winner !== null || current.isDraw)) {
        const onKillResult = resolveTriggers(current, TriggerType.ON_KILL, liveDefender.instanceId, defenderId, { attackingPlayerId: attackerId })
        current = onKillResult.nextState
        events.push(...onKillResult.events)

        const onDestroyResult = resolveTriggers(current, TriggerType.ON_DESTROY, finalAttacker.instanceId, attackerId, {
          attackingPlayerId: attackerId,
          destroyedCardId,
          destroyedOwner: attackerId,
          destroyedIsPrimed,
        })
        current = onDestroyResult.nextState
        events.push(...onDestroyResult.events)
      }
    }
  }

  current = checkWinConditions(current)

  return { nextState: current, events }
}

export function resolveDirectAttack(
  state: GameState,
  attacker: UnitInstance,
  attackerId: string,
  targetPlayerId: string
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []

  const liveAttacker = findUnitOnBattlefield(getPlayer(current, attackerId), attacker.instanceId)
  if (!liveAttacker) return { nextState: current, events }

  // ON_ATTACK trigger
  const onAttackResult = resolveTriggers(current, TriggerType.ON_ATTACK, liveAttacker.instanceId, attackerId, { attackingPlayerId: attackerId })
  current = onAttackResult.nextState
  events.push(...onAttackResult.events)

  // Re-fetch attacker in case ON_ATTACK modified state
  const freshAttacker = findUnitOnBattlefield(getPlayer(current, attackerId), liveAttacker.instanceId)
  if (!freshAttacker) return { nextState: current, events }

  const damage = freshAttacker.attack
  const targetPlayer = getPlayer(current, targetPlayerId)
  targetPlayer.life -= damage
  events.push({ type: "PLAYER_DAMAGED", playerId: targetPlayerId, damage, remainingLife: targetPlayer.life, attackerInstanceId: freshAttacker.instanceId })

  // Lifesteal on direct damage
  if (hasKeyword(freshAttacker, Keyword.Lifesteal)) {
    const attPlayer = getPlayer(current, attackerId)
    attPlayer.life += damage
    events.push({ type: "PLAYER_HEALED", playerId: attackerId, amount: damage, newLife: attPlayer.life })
  }

  // ON_HIT trigger: unit dealt damage directly to enemy player
  const onHitResult = resolveTriggers(current, TriggerType.ON_HIT, freshAttacker.instanceId, attackerId, { attackingPlayerId: attackerId })
  current = onHitResult.nextState
  events.push(...onHitResult.events)

  current = checkWinConditions(current)

  return { nextState: current, events }
}
