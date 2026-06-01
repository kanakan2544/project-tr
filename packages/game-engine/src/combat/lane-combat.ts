import type { GameState, GameEvent } from "@tcg/shared-types"
import { Keyword } from "@tcg/shared-types"
import { deepCloneState, getOpponentId, getPlayer, getUnitInLane } from "../utils/state-helpers"
import { hasKeyword } from "../systems/keyword-resolver"
import { resolveAttackTarget } from "./attack-targeting"
import { resolveDirectAttack, resolveUnitVsUnit } from "./damage-calculator"

export function resolveLaneCombat(
  state: GameState,
  laneIndex: number
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []

  const attackingPlayerId = current.activePlayer
  const attackingPlayer = getPlayer(current, attackingPlayerId)
  const attacker = getUnitInLane(attackingPlayer, laneIndex)

  // No attacker in this lane
  if (!attacker) return { nextState: current, events }

  // Attacker has Stand By — cannot attack
  if (attacker.status.standBy) return { nextState: current, events }

  // Defender keyword — cannot attack
  if (hasKeyword(attacker, Keyword.Defender)) return { nextState: current, events }

  const target = resolveAttackTarget(current, attackingPlayerId, laneIndex, attacker)

  if (target.type === "unit") {
    const defendingPlayerId = getOpponentId(current, attackingPlayerId)
    const result = resolveUnitVsUnit(current, attacker, attackingPlayerId, target.unit, defendingPlayerId)
    current = result.nextState
    events.push(...result.events)
  } else {
    const result = resolveDirectAttack(current, attacker, attackingPlayerId, target.playerId)
    current = result.nextState
    events.push(...result.events)
  }

  // DoubleAttack: if attacker survived and has DoubleAttack, attack again
  if (!current.winner && !current.isDraw) {
    const freshAttackingPlayer = getPlayer(current, attackingPlayerId)
    const freshAttacker = getUnitInLane(freshAttackingPlayer, laneIndex)
    if (freshAttacker && hasKeyword(freshAttacker, Keyword.DoubleAttack)) {
      const target2 = resolveAttackTarget(current, attackingPlayerId, laneIndex, freshAttacker)
      if (target2.type === "unit") {
        const defendingPlayerId = getOpponentId(current, attackingPlayerId)
        const result2 = resolveUnitVsUnit(current, freshAttacker, attackingPlayerId, target2.unit, defendingPlayerId)
        current = result2.nextState
        events.push(...result2.events)
      } else {
        const result2 = resolveDirectAttack(current, freshAttacker, attackingPlayerId, target2.playerId)
        current = result2.nextState
        events.push(...result2.events)
      }
    }
  }

  return { nextState: current, events }
}
