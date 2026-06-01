import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType, Phase } from "@tcg/shared-types"
import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { P1, P2, SEED } from "./helpers"

function createLargeHandState(): GameEngine {
  resetIdCounter()
  const state = createInitialGameState(
    "end-turn-select-test", P1, P2,
    Array(30).fill("iron_sentinel") as string[],
    Array(30).fill("iron_sentinel") as string[],
    "cyclone_sovereign", "cyclone_sovereign",
    SEED
  )
  const engine = new GameEngine(state)
  return engine
}

describe("End Turn Select", () => {
  it("auto-proceeds to END_TURN when hand size <= 2", () => {
    const engine = createLargeHandState()

    // Infuse 3 cards to reduce hand to 2
    const s = engine.getState()
    const hand = s.players[P1]!.hand
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[1]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[2]!.instanceId })

    // Hand now has 2 cards — end main phase should skip END_TURN_SELECT
    const result = engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
    // Should auto-proceed: no END_TURN_SELECT phase needed
    // After full end turn, it's P2's turn in MAIN_PHASE
    expect(engine.getState().phase).toBe(Phase.MAIN_PHASE)
    expect(engine.getState().activePlayer).toBe(P2)
  })

  it("requires END_TURN_SELECT when hand > 2", () => {
    const engine = createLargeHandState()

    // P1 has 5 cards — end main phase should trigger END_TURN_SELECT
    const result = engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
    expect(result.success).toBe(true)
    expect(engine.getState().phase).toBe(Phase.END_TURN_SELECT)
    expect(engine.getState().activePlayer).toBe(P1)
    const selectEvent = result.events?.find((e) => e.type === "END_TURN_SELECT_REQUIRED")
    expect(selectEvent).toBeDefined()
  })

  it("player selects exactly 2 cards to keep", () => {
    const engine = createLargeHandState()
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

    const s = engine.getState()
    const hand = s.players[P1]!.hand
    const keepIds = [hand[0]!.instanceId, hand[1]!.instanceId]

    const result = engine.dispatch({
      type: ActionType.END_TURN_SELECT,
      playerId: P1,
      keepInstanceIds: keepIds,
    })
    expect(result.success).toBe(true)
    // After selection, turn ends and it's P2's turn in MAIN_PHASE
    expect(engine.getState().phase).toBe(Phase.MAIN_PHASE)
    expect(engine.getState().activePlayer).toBe(P2)
  })

  it("rejects selection with > 2 cards", () => {
    const engine = createLargeHandState()
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

    const s = engine.getState()
    const hand = s.players[P1]!.hand
    const keepIds = [hand[0]!.instanceId, hand[1]!.instanceId, hand[2]!.instanceId]

    const result = engine.dispatch({
      type: ActionType.END_TURN_SELECT,
      playerId: P1,
      keepInstanceIds: keepIds,
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("INVALID_KEEP_SELECTION")
  })

  it("rejects selection with invalid instance IDs", () => {
    const engine = createLargeHandState()
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

    const result = engine.dispatch({
      type: ActionType.END_TURN_SELECT,
      playerId: P1,
      keepInstanceIds: ["fake#0000", "fake#0001"],
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("INVALID_KEEP_SELECTION")
  })

  it("discarded cards go to revolve pile", () => {
    const engine = createLargeHandState()
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

    const s = engine.getState()
    const hand = s.players[P1]!.hand
    const keepIds = [hand[0]!.instanceId, hand[1]!.instanceId]
    const discardIds = hand.slice(2).map((c) => c.instanceId)

    engine.dispatch({
      type: ActionType.END_TURN_SELECT,
      playerId: P1,
      keepInstanceIds: keepIds,
    })

    // Check revolve pile contains discarded cards (they get shuffled in next revolve, or just sit there)
    const after = engine.getState().players[P1]!
    for (const id of discardIds) {
      const inRevolve = after.revolvePile.some((c) => c.instanceId === id)
      const inDeck = after.deck.some((c) => c.instanceId === id)
      expect(inRevolve || inDeck).toBe(true) // may have been used in draw
    }
  })
})
