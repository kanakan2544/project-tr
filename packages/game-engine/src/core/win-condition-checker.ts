import type { GameState } from "@tcg/shared-types"
import { getOpponentId } from "../utils/state-helpers"

export function checkWinConditions(state: GameState): GameState {
  if (state.winner !== null || state.isDraw) return state

  const playerIds = Object.keys(state.players)
  const deadPlayers = playerIds.filter((id) => {
    const player = state.players[id]
    return player !== undefined && player.life <= 0
  })

  if (deadPlayers.length === 0) return state

  const next = { ...state }

  if (deadPlayers.length >= 2) {
    next.isDraw = true
    return next
  }

  const loser = deadPlayers[0]!
  next.winner = getOpponentId(state, loser)
  return next
}
