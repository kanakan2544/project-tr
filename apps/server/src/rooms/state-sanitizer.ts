import type { GameState, PlayerId } from "@tcg/shared-types"

export interface ClientHandInfo {
  count: number
}

export type ClientGameState = Omit<GameState, "players"> & {
  players: Record<PlayerId, Omit<GameState["players"][string], "hand"> & {
    hand: ClientHandInfo | GameState["players"][string]["hand"]
    isOpponent: boolean
  }>
}

export function sanitizeStateForPlayer(state: GameState, playerId: PlayerId): ClientGameState {
  const sanitized: ClientGameState = {
    ...state,
    players: Object.fromEntries(
      Object.entries(state.players).map(([id, playerState]) => {
        const isOwn = id === playerId
        return [
          id,
          {
            ...playerState,
            isOpponent: !isOwn,
            // Hide opponent's hand — only expose count
            hand: isOwn ? playerState.hand : { count: playerState.hand.length },
            // Hide opponent's deck order
            deck: isOwn ? playerState.deck : playerState.deck.map((c) => ({ ...c, cardId: "hidden" })),
          },
        ]
      })
    ),
  }
  return sanitized
}
