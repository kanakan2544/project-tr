import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType, Phase } from "@tcg/shared-types"
import { createTestState, P1, P2, endFullTurn } from "./helpers"

describe("Turn Flow", () => {
  it("creates initial state with correct values", () => {
    const state = createTestState()
    const p1 = state.players[P1]!
    const p2 = state.players[P2]!

    expect(p1.life).toBe(25)
    expect(p2.life).toBe(25)
    expect(p1.hand.length).toBe(5)
    expect(p2.hand.length).toBe(6) // second player bonus
    expect(p1.battlefield.length).toBe(5)
    expect(p2.battlefield.length).toBe(5)
    expect(p1.revolveCount).toBe(0)
    expect(p1.temporaryResources).toBe(0)
    expect(state.turn).toBe(1)
    expect(state.activePlayer).toBe(P1)
  })

  it("starts in MAIN_PHASE after engine init (auto-advances from START_TURN)", () => {
    const engine = new GameEngine(createTestState())
    expect(engine.getState().phase).toBe(Phase.MAIN_PHASE)
  })

  it("transitions to P2's MAIN_PHASE after P1 ends turn", () => {
    const engine = new GameEngine(createTestState())

    endFullTurn(engine, P1)

    const afterState = engine.getState()
    expect(afterState.phase).toBe(Phase.MAIN_PHASE)
    expect(afterState.activePlayer).toBe(P2)
    expect(afterState.turn).toBe(2)
  })

  it("increments turn counter each round", () => {
    const engine = new GameEngine(createTestState())

    endFullTurn(engine, P1)
    expect(engine.getState().turn).toBe(2)
    expect(engine.getState().activePlayer).toBe(P2)

    endFullTurn(engine, P2)
    expect(engine.getState().turn).toBe(3)
    expect(engine.getState().activePlayer).toBe(P1)
  })

  it("rejects action from wrong player", () => {
    const engine = new GameEngine(createTestState())
    const result = engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P2 })
    expect(result.success).toBe(false)
    expect(result.error).toBe("NOT_YOUR_TURN")
  })
})
