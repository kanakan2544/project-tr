import type { GameState, GameEvent } from "@tcg/shared-types"
import { resolveLaneCombat } from "./lane-combat"
import { recomputeAuras } from "../systems/aura-system"

const LANE_COUNT = 5

export function resolveCombat(state: GameState): { nextState: GameState; events: GameEvent[] } {
  let current = state
  const allEvents: GameEvent[] = []

  for (let laneIndex = 0; laneIndex < LANE_COUNT; laneIndex++) {
    const result = resolveLaneCombat(current, laneIndex)
    current = recomputeAuras(result.nextState)
    allEvents.push(...result.events)

    // Stop if game ended
    if (current.winner !== null || current.isDraw) break
  }

  return { nextState: current, events: allEvents }
}
