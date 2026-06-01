import type { GameState, GameEvent, UnitInstance, PlayerId } from "@tcg/shared-types"
import { getPlayer } from "./state-helpers"

export function destroyUnit(
  state: GameState,
  unit: UnitInstance,
  ownerId: PlayerId,
  events: GameEvent[]
): void {
  const owner = getPlayer(state, ownerId)
  const lane = owner.battlefield.find((l) => l.unit?.instanceId === unit.instanceId)
  if (!lane) return

  events.push({ type: "UNIT_DESTROYED", instanceId: unit.instanceId, lane: lane.index, owner: ownerId })
  owner.discardPile.push({
    instanceId: unit.instanceId,
    cardId: unit.cardId,
    owner: unit.owner,
    primedInfuseCount: unit.primedInfuseCount,
    infuseValueBonus: 0,
  })
  lane.unit = null
}
