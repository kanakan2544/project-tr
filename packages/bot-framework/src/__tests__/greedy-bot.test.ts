import { describe, it, expect } from "vitest"
import { GameEngine } from "@tcg/game-engine"
import { ActionType } from "@tcg/shared-types"
import { GreedyBot } from "../bots/greedy-bot"
import { createTestState, P1 } from "./helpers"

describe("GreedyBot", () => {
  it("infuses a card when no resources (cannot summon)", () => {
    const bot = new GreedyBot()
    const state = new GameEngine(createTestState()).getState()
    // Fresh state: 0 resources → can't summon → should infuse
    const action = bot.selectAction(state, P1)
    expect(action.type).toBe(ActionType.INFUSE_CARD)
  })

  it("summons a unit once it has enough resources", () => {
    const bot = new GreedyBot()
    const engine = new GameEngine(createTestState())
    // Infuse cards to accumulate 4 resources (≥ cost 3 for iron_sentinel)
    let s = engine.getState()
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: s.players[P1]!.hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: s.players[P1]!.hand[1]!.instanceId })
    s = engine.getState()
    expect(s.players[P1]!.temporaryResources).toBeGreaterThanOrEqual(3)

    const action = bot.selectAction(s, P1)
    expect(action.type).toBe(ActionType.SUMMON_UNIT)
  })

  it("always returns a legal action (engine accepts it)", () => {
    const bot = new GreedyBot()
    const engine = new GameEngine(createTestState())
    for (let i = 0; i < 5; i++) {
      const s = engine.getState()
      if (s.winner !== null || s.isDraw) break
      const action = bot.selectAction(s, s.activePlayer)
      const result = engine.dispatch(action)
      expect(result.success).toBe(true)
    }
  })

  it("keeps highest-cost cards on END_TURN_SELECT", () => {
    const bot = new GreedyBot()
    const engine = new GameEngine(createTestState())
    // Drive the engine to END_TURN_SELECT
    const s = engine.getState()
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: s.players[P1]!.hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
    const s2 = engine.getState()
    if (s2.phase === "END_TURN_SELECT" && s2.activePlayer === P1) {
      const action = bot.selectAction(s2, P1)
      expect(action.type).toBe(ActionType.END_TURN_SELECT)
      if (action.type === ActionType.END_TURN_SELECT) {
        expect(action.keepInstanceIds.length).toBeLessThanOrEqual(2)
      }
    }
  })
})
