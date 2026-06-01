import type { GameState, PlayerId, CardInstance } from "@tcg/shared-types"

// State sent to client — opponent's hand is hidden
export type ClientHandInfo = { count: number }

export type ClientPlayerState = Omit<GameState["players"][string], "hand"> & {
  hand: CardInstance[] | ClientHandInfo
  isOpponent: boolean
}

export type ClientGameState = Omit<GameState, "players"> & {
  players: Record<PlayerId, ClientPlayerState>
}
