import type { GameState } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { getAdjacentLanes, getPlayer } from "../utils/state-helpers"
import { hasKeyword } from "./keyword-resolver"
import { Keyword } from "@tcg/shared-types"

export function recomputeAuras(state: GameState): GameState {
  // Step 1: strip all previously-applied aura attack bonuses
  for (const player of Object.values(state.players)) {
    for (const lane of player.battlefield) {
      if (!lane.unit) continue
      const prev = (lane.unit.flags.auraAttack as number | undefined) ?? 0
      if (prev !== 0) {
        lane.unit.attack -= prev
        lane.unit.flags.auraAttack = 0
      }
    }
  }

  // Step 2: apply auras from non-silenced aura sources
  for (const [ownerId, player] of Object.entries(state.players)) {
    for (const lane of player.battlefield) {
      if (!lane.unit) continue
      const unit = lane.unit
      if (hasKeyword(unit, Keyword.Silence)) continue

      const cardData = getCard(unit.cardId)
      if (cardData.type !== "Unit" || !cardData.aura) continue
      if (unit.status.silenced) continue

      const aura = cardData.aura
      const ownerPlayer = getPlayer(state, ownerId)
      const bonus = (aura.attack ?? 0) * (aura.perRevolve ? ownerPlayer.revolveCount : 1)
      if (bonus === 0) continue

      for (const adjIdx of getAdjacentLanes(lane.index)) {
        const adjUnit = ownerPlayer.battlefield[adjIdx]?.unit
        if (!adjUnit) continue
        adjUnit.attack += bonus
        adjUnit.flags.auraAttack = ((adjUnit.flags.auraAttack as number | undefined) ?? 0) + bonus
      }
    }
  }

  return state
}
