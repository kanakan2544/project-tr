import type { GameState, PlayerId } from "@tcg/shared-types"
import { TargetType } from "@tcg/shared-types"
import { findUnitOnBattlefield, getOpponentId, getPlayer } from "../utils/state-helpers"

export interface ResolvedTarget {
  unitInstanceId?: string
  playerId?: PlayerId
}

export function resolveTarget(
  state: GameState,
  targetType: TargetType,
  sourceInstanceId: string | null,
  sourceOwner: PlayerId,
  explicitTargetInstanceId?: string,
  explicitTargetPlayerId?: PlayerId
): ResolvedTarget | null {
  switch (targetType) {
    case TargetType.SELF: {
      if (!sourceInstanceId) return null
      return { unitInstanceId: sourceInstanceId }
    }

    case TargetType.OPPOSING_UNIT: {
      if (!sourceInstanceId) return null
      const sourcePlayer = getPlayer(state, sourceOwner)
      let sourceLane = -1
      for (const lane of sourcePlayer.battlefield) {
        if (lane.unit?.instanceId === sourceInstanceId) {
          sourceLane = lane.index
          break
        }
      }
      if (sourceLane === -1) return null
      const opponentId = getOpponentId(state, sourceOwner)
      const opponent = getPlayer(state, opponentId)
      const opposingUnit = opponent.battlefield[sourceLane]?.unit
      if (!opposingUnit) return null
      return { unitInstanceId: opposingUnit.instanceId }
    }

    case TargetType.ENEMY_PLAYER: {
      const opponentId = getOpponentId(state, sourceOwner)
      return { playerId: opponentId }
    }

    case TargetType.ALLY_PLAYER: {
      return { playerId: sourceOwner }
    }

    case TargetType.ENEMY_UNIT:
    case TargetType.ALLY_UNIT:
    case TargetType.ANY_UNIT: {
      if (explicitTargetInstanceId) return { unitInstanceId: explicitTargetInstanceId }
      if (explicitTargetPlayerId) return { playerId: explicitTargetPlayerId }
      return null
    }

    // List targets — caller must iterate manually
    case TargetType.ALL_UNITS:
    case TargetType.ALL_ENEMY_UNITS:
    case TargetType.ALL_ALLY_UNITS: {
      return null
    }
  }
}

export function resolveAllTargets(
  state: GameState,
  targetType: TargetType.ALL_UNITS | TargetType.ALL_ENEMY_UNITS | TargetType.ALL_ALLY_UNITS,
  sourceOwner: PlayerId
): ResolvedTarget[] {
  const targets: ResolvedTarget[] = []
  const opponentId = getOpponentId(state, sourceOwner)

  if (targetType === TargetType.ALL_ENEMY_UNITS) {
    const opponent = getPlayer(state, opponentId)
    for (const lane of opponent.battlefield) {
      if (lane.unit) targets.push({ unitInstanceId: lane.unit.instanceId })
    }
  } else if (targetType === TargetType.ALL_ALLY_UNITS) {
    const owner = getPlayer(state, sourceOwner)
    for (const lane of owner.battlefield) {
      if (lane.unit) targets.push({ unitInstanceId: lane.unit.instanceId })
    }
  } else {
    for (const pid of [sourceOwner, opponentId]) {
      const p = getPlayer(state, pid)
      for (const lane of p.battlefield) {
        if (lane.unit) targets.push({ unitInstanceId: lane.unit.instanceId })
      }
    }
  }

  return targets
}
