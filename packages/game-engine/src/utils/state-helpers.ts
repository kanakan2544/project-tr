import type { GameState, PlayerState, LaneState, UnitInstance, CardInstance, PlayerId } from "@tcg/shared-types"

export function getOpponentId(state: GameState, playerId: PlayerId): PlayerId {
  const ids = Object.keys(state.players)
  const opponent = ids.find((id) => id !== playerId)
  if (!opponent) throw new Error("Opponent not found")
  return opponent
}

export function getPlayer(state: GameState, playerId: PlayerId): PlayerState {
  const player = state.players[playerId]
  if (!player) throw new Error(`Player not found: ${playerId}`)
  return player
}

export function getLane(player: PlayerState, laneIndex: number): LaneState {
  const lane = player.battlefield[laneIndex]
  if (!lane) throw new Error(`Lane ${laneIndex} not found`)
  return lane
}

export function getUnitInLane(player: PlayerState, laneIndex: number): UnitInstance | null {
  return getLane(player, laneIndex).unit
}

export function findCardInHand(player: PlayerState, instanceId: string): CardInstance | null {
  return player.hand.find((c) => c.instanceId === instanceId) ?? null
}

export function findUnitOnBattlefield(player: PlayerState, instanceId: string): UnitInstance | null {
  for (const lane of player.battlefield) {
    if (lane.unit?.instanceId === instanceId) return lane.unit
  }
  return null
}

export function isLaneEmpty(player: PlayerState, laneIndex: number): boolean {
  return getLane(player, laneIndex).unit === null
}

export function getAdjacentLanes(laneIndex: number): number[] {
  const adjacent: number[] = []
  if (laneIndex > 0) adjacent.push(laneIndex - 1)
  if (laneIndex < 4) adjacent.push(laneIndex + 1)
  return adjacent
}

export function deepCloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState
}
