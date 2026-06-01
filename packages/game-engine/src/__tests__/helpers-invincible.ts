import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { GameEngine } from "../core/game-engine"
import type { GameState, CardInstance } from "@tcg/shared-types"
import { ActionType, Phase } from "@tcg/shared-types"
import { generateInstanceId } from "../utils/id-generator"

export const P1 = "player1"
export const P2 = "player2"
export const SEED = 42

const BASE_UNIT = "iron_sentinel"
const ACE = "cyclone_sovereign"

export function makeDeck(targetCardId: string, count = 1): string[] {
  const deck: string[] = []
  for (let i = 0; i < count; i++) deck.push(targetCardId)
  while (deck.length < 30) deck.push(BASE_UNIT)
  return deck
}

/**
 * Creates an engine with a standard deck, then injects the target card into
 * P1's hand and sets P1's temporaryResources to `resources`.
 * This avoids relying on shuffle order.
 */
export function createEngineWithCard(
  targetCardId: string,
  resources: number = 10,
): GameEngine {
  resetIdCounter()
  const p1Deck = Array(30).fill(BASE_UNIT) as string[]
  const p2Deck = Array(30).fill(BASE_UNIT) as string[]
  const initialState = createInitialGameState("test-inv", P1, P2, p1Deck, p2Deck, ACE, ACE, SEED)
  const engine = new GameEngine(initialState)

  const state = engine.getState()
  const newCard: CardInstance = {
    instanceId: generateInstanceId(targetCardId),
    cardId: targetCardId,
    owner: P1,
    primedInfuseCount: 0,
    infuseValueBonus: 0,
  }

  const modifiedState: GameState = {
    ...state,
    players: {
      ...state.players,
      [P1]: {
        ...state.players[P1]!,
        hand: [...state.players[P1]!.hand, newCard],
        temporaryResources: resources,
      },
    },
  }
  engine.loadState(modifiedState)
  return engine
}

/** Convenience alias used in many tests */
export function createTestEngine(targetCardId: string): GameEngine {
  return createEngineWithCard(targetCardId)
}

export function endFullTurn(engine: GameEngine, playerId: string): void {
  engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId })
  const state = engine.getState()
  if (state.phase === Phase.END_TURN_SELECT && state.activePlayer === playerId) {
    const hand = state.players[playerId]!.hand
    const keepIds = hand.slice(0, 2).map((c) => c.instanceId)
    engine.dispatch({ type: ActionType.END_TURN_SELECT, playerId, keepInstanceIds: keepIds })
  }
}
