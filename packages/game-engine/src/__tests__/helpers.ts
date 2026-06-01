import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { GameEngine } from "../core/game-engine"
import type { GameState } from "@tcg/shared-types"
import { ActionType, Phase } from "@tcg/shared-types"

export const P1 = "player1"
export const P2 = "player2"
export const SEED = 42

const BASIC_DECK = Array(30).fill("iron_sentinel") as string[]
const ACE_CARD = "cyclone_sovereign"

export function createTestState(): GameState {
  resetIdCounter()
  return createInitialGameState(
    "test-match",
    P1,
    P2,
    BASIC_DECK,
    BASIC_DECK,
    ACE_CARD,
    ACE_CARD,
    SEED
  )
}

/**
 * Ends the active player's turn, automatically handling END_TURN_SELECT
 * by keeping the first 2 cards (or all cards if ≤ 2).
 */
export function endFullTurn(engine: GameEngine, playerId: string): void {
  engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId })
  const state = engine.getState()
  if (state.phase === Phase.END_TURN_SELECT && state.activePlayer === playerId) {
    const hand = state.players[playerId]!.hand
    const keepIds = hand.slice(0, 2).map((c) => c.instanceId)
    engine.dispatch({ type: ActionType.END_TURN_SELECT, playerId, keepInstanceIds: keepIds })
  }
}
