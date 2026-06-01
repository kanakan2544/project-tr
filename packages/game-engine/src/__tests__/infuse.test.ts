import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType } from "@tcg/shared-types"
import { createTestState, P1, endFullTurn } from "./helpers"

describe("Infuse System", () => {
  it("adds infuseValue to temporaryResources", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const cardId = state.players[P1]!.hand[0]!.instanceId

    const result = engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: cardId })
    expect(result.success).toBe(true)
    // iron_sentinel infuseValue = 2
    expect(engine.getState().players[P1]!.temporaryResources).toBe(2)
  })

  it("moves infused card to revolve pile", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const cardInst = state.players[P1]!.hand[0]!

    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: cardInst.instanceId })

    const after = engine.getState().players[P1]!
    expect(after.hand.some((c) => c.instanceId === cardInst.instanceId)).toBe(false)
    expect(after.revolvePile.some((c) => c.instanceId === cardInst.instanceId)).toBe(true)
  })

  it("accumulates resources from multiple infuses", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const h = state.players[P1]!.hand

    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: h[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: h[1]!.instanceId })

    expect(engine.getState().players[P1]!.temporaryResources).toBe(4) // 2 + 2
  })

  it("resources reset to 0 at end of turn", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const hand = state.players[P1]!.hand

    // Infuse 3 cards so hand drops to 2 (auto-proceed end turn)
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[1]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[2]!.instanceId })

    // Hand now has 2 cards — end main phase auto-proceeds (no END_TURN_SELECT)
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

    // After turn ends, P2 is active. P1's resources should be 0.
    expect(engine.getState().players[P1]!.temporaryResources).toBe(0)
  })

  it("rejects infuse of card not in hand", () => {
    const engine = new GameEngine(createTestState())
    const result = engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: "nonexistent#0000" })
    expect(result.success).toBe(false)
    expect(result.error).toBe("CARD_NOT_IN_HAND")
  })

  it("Unit gains infuseValueBonus of 1 after first infuse", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const cardInst = state.players[P1]!.hand[0]!

    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: cardInst.instanceId })

    const inRevolve = engine.getState().players[P1]!.revolvePile.find(
      (c) => c.instanceId === cardInst.instanceId
    )
    expect(inRevolve?.infuseValueBonus).toBe(1)
  })

  it("infuseValueBonus caps at 3 and generates base+3 resources when saturated", () => {
    const engine = new GameEngine(createTestState())

    // Manually set bonus to 3 on the first hand card (simulating prior infuses)
    const stateBefore = engine.getState()
    const patchedState = JSON.parse(JSON.stringify(stateBefore)) as typeof stateBefore
    patchedState.players[P1]!.hand[0]!.infuseValueBonus = 3

    const engine2 = new GameEngine(patchedState)
    const cardInstId = engine2.getState().players[P1]!.hand[0]!.instanceId

    engine2.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: cardInstId })

    // iron_sentinel base infuseValue=2, bonus=3 → generates 5
    expect(engine2.getState().players[P1]!.temporaryResources).toBe(5)

    // Bonus stays at 3 (not incremented beyond cap)
    const inRevolve = engine2.getState().players[P1]!.revolvePile.find(
      (c) => c.instanceId === cardInstId
    )
    expect(inRevolve?.infuseValueBonus).toBe(3)
  })

  it("cannot play card without sufficient resources", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    // iron_sentinel costs 3, we have 0 resources
    const result = engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: state.players[P1]!.hand[0]!.instanceId,
      targetLane: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("INSUFFICIENT_RESOURCES")
  })
})
