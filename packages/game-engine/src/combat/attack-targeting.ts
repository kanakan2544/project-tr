import type { GameState, UnitInstance } from "@tcg/shared-types"
import { Keyword } from "@tcg/shared-types"
import { getAdjacentLanes, getOpponentId, getPlayer, getUnitInLane } from "../utils/state-helpers"
import { hasKeyword } from "../systems/keyword-resolver"

export type AttackTarget =
  | { type: "unit"; unit: UnitInstance }
  | { type: "player"; playerId: string }

export function resolveAttackTarget(
  state: GameState,
  attackingPlayerId: string,
  laneIndex: number,
  attacker: UnitInstance
): AttackTarget {
  const defendingPlayerId = getOpponentId(state, attackingPlayerId)
  const defender = getPlayer(state, defendingPlayerId)

  // Evasion: always attack player directly, ignore all units
  if (hasKeyword(attacker, Keyword.Evasion)) {
    return { type: "player", playerId: defendingPlayerId }
  }

  // Guard: adjacent enemy Guard units redirect the attack (Guard > Ambush)
  const adjacent = getAdjacentLanes(laneIndex)
  for (const adjLane of adjacent) {
    const adjUnit = getUnitInLane(defender, adjLane)
    if (adjUnit && hasKeyword(adjUnit, Keyword.Guard)) {
      return { type: "unit", unit: adjUnit }
    }
  }

  // Check opposing lane — Ambush redirects attack to defending player
  const opposingUnit = getUnitInLane(defender, laneIndex)
  if (opposingUnit) {
    if (hasKeyword(opposingUnit, Keyword.Ambush)) {
      return { type: "player", playerId: defendingPlayerId }
    }
    return { type: "unit", unit: opposingUnit }
  }

  // No unit in opposing lane — direct attack
  return { type: "player", playerId: defendingPlayerId }
}
