import type { GameAction, GameState } from "@tcg/shared-types"
import type { BotPlayer } from "./bot-interface"
import { generateValidActions } from "./action-generator"
import { ActionType } from "@tcg/shared-types"

function lcgRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}

export class RandomBot implements BotPlayer {
  readonly name = "RandomBot"

  selectAction(state: GameState, playerId: string): GameAction {
    const actions = generateValidActions(state, playerId)

    if (actions.length === 0) {
      return { type: ActionType.END_MAIN_PHASE, playerId }
    }

    const seed = (state.shuffleSeed ^ (state.turn * 31337)) >>> 0
    const rand = lcgRandom(seed + actions.length)
    const index = Math.floor(rand() * actions.length)
    return actions[index]!
  }
}
