import type { GameAction, GameState } from "@tcg/shared-types"

export interface BotPlayer {
  readonly name: string
  selectAction(state: GameState, playerId: string): GameAction
}
