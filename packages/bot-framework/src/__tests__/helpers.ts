import { createInitialGameState } from "@tcg/game-engine"

export const P1 = "player1"
export const P2 = "player2"
export const SEED = 42
export const BASIC_DECK = Array(30).fill("iron_sentinel") as string[]
export const ACE_CARD = "cyclone_sovereign"

export function createTestState() {
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
