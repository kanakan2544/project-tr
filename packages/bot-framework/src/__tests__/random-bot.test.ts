import { describe, it, expect } from "vitest"
import { GameEngine } from "@tcg/game-engine"
import { ActionType } from "@tcg/shared-types"
import { RandomBot } from "../bots/random-bot"
import { createTestState, P1 } from "./helpers"

describe("RandomBot", () => {
  it("always returns a valid action", () => {
    const bot = new RandomBot()
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const action = bot.selectAction(state, P1)
    expect(action).toBeDefined()
    expect(action.playerId).toBe(P1)
  })

  it("is deterministic — same state produces same action", () => {
    const bot = new RandomBot()
    const state = new GameEngine(createTestState()).getState()
    const a1 = bot.selectAction(state, P1)
    const a2 = bot.selectAction(state, P1)
    expect(a1).toEqual(a2)
  })

  it("result is a valid action (engine accepts it)", () => {
    const bot = new RandomBot()
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const action = bot.selectAction(state, P1)
    const result = engine.dispatch(action)
    expect(result.success).toBe(true)
  })

  it("falls back to END_MAIN_PHASE when no actions available", () => {
    const bot = new RandomBot()
    // Create a state where player is not active
    const state = new GameEngine(createTestState()).getState()
    // Pass opponent's id — generateValidActions returns [] → fallback
    const action = bot.selectAction(state, "player2")
    expect(action.type).toBe(ActionType.END_MAIN_PHASE)
  })
})
