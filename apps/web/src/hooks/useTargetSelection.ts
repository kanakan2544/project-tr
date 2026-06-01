import { useState, useCallback } from "react"
import { TargetType } from "@tcg/shared-types"
import type { UnitInstance } from "@tcg/shared-types"

export type TargetSelectionState =
  | { mode: "none" }
  | { mode: "spell"; cardInstanceId: string; validTargetTypes: TargetType[] }
  | { mode: "ability"; unitInstanceId: string; abilityIndex: number; validTargetTypes: TargetType[] }

const UNIT_TARGET_TYPES = new Set([
  TargetType.ALLY_UNIT,
  TargetType.ENEMY_UNIT,
  TargetType.ANY_UNIT,
  TargetType.ALL_UNITS,
  TargetType.ALL_ENEMY_UNITS,
])

const PLAYER_TARGET_TYPES = new Set([TargetType.ALLY_PLAYER, TargetType.ENEMY_PLAYER])

const EXPLICIT_TARGET_TYPES = new Set([
  TargetType.ALLY_UNIT,
  TargetType.ENEMY_UNIT,
  TargetType.ANY_UNIT,
  TargetType.ALLY_PLAYER,
  TargetType.ENEMY_PLAYER,
])

export function useTargetSelection(myPlayerId: string) {
  const [state, setState] = useState<TargetSelectionState>({ mode: "none" })

  const startSpellTarget = useCallback((cardInstanceId: string, validTargetTypes: TargetType[]) => {
    setState({ mode: "spell", cardInstanceId, validTargetTypes })
  }, [])

  const startAbilityTarget = useCallback(
    (unitInstanceId: string, abilityIndex: number, validTargetTypes: TargetType[]) => {
      setState({ mode: "ability", unitInstanceId, abilityIndex, validTargetTypes })
    },
    []
  )

  const cancel = useCallback(() => {
    setState({ mode: "none" })
  }, [])

  const currentTargetTypes = state.mode !== "none" ? state.validTargetTypes : []

  const isValidUnitTarget = useCallback(
    (unit: UnitInstance): boolean => {
      if (currentTargetTypes.length === 0) return false
      const isAlly = unit.owner === myPlayerId
      return currentTargetTypes.some((t) => {
        switch (t) {
          case TargetType.ALLY_UNIT:
            return isAlly
          case TargetType.ENEMY_UNIT:
            return !isAlly
          case TargetType.ANY_UNIT:
          case TargetType.ALL_UNITS:
            return true
          case TargetType.ALL_ENEMY_UNITS:
            return !isAlly
          default:
            return false
        }
      })
    },
    [currentTargetTypes, myPlayerId]
  )

  const isValidPlayerTarget = useCallback(
    (playerId: string): boolean => {
      if (currentTargetTypes.length === 0) return false
      const isSelf = playerId === myPlayerId
      return currentTargetTypes.some((t) => {
        switch (t) {
          case TargetType.ALLY_PLAYER:
            return isSelf
          case TargetType.ENEMY_PLAYER:
            return !isSelf
          default:
            return false
        }
      })
    },
    [currentTargetTypes, myPlayerId]
  )

  const needsExplicitTarget = currentTargetTypes.some((t) => EXPLICIT_TARGET_TYPES.has(t))

  const isAoE = currentTargetTypes.some(
    (t) => t === TargetType.ALL_UNITS || t === TargetType.ALL_ENEMY_UNITS
  )

  const targetsUnits = currentTargetTypes.some((t) => UNIT_TARGET_TYPES.has(t))
  const targetsPlayers = currentTargetTypes.some((t) => PLAYER_TARGET_TYPES.has(t))

  return {
    state,
    startSpellTarget,
    startAbilityTarget,
    cancel,
    isValidUnitTarget,
    isValidPlayerTarget,
    needsExplicitTarget,
    isAoE,
    targetsUnits,
    targetsPlayers,
  }
}
