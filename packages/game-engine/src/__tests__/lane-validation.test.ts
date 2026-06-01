import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType } from "@tcg/shared-types"
import { createTestState, P1, P2, endFullTurn } from "./helpers"

function infuseAndSummon(engine: GameEngine, playerId: string, lane: number): boolean {
  const state = engine.getState()
  const hand = state.players[playerId]!.hand
  if (hand.length < 3) return false

  engine.dispatch({ type: ActionType.INFUSE_CARD, playerId, cardInstanceId: hand[0]!.instanceId })
  engine.dispatch({ type: ActionType.INFUSE_CARD, playerId, cardInstanceId: hand[1]!.instanceId })

  const fresh = engine.getState().players[playerId]!.hand
  const result = engine.dispatch({
    type: ActionType.SUMMON_UNIT,
    playerId,
    cardInstanceId: fresh[0]!.instanceId,
    targetLane: lane,
  })
  return result.success
}

describe("Lane Validation", () => {
  it("rejects summon to negative lane index", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const p1 = state.players[P1]!
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[1]!.instanceId })

    const fresh = engine.getState().players[P1]!.hand
    const result = engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: fresh[0]!.instanceId,
      targetLane: -1,
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("LANE_OUT_OF_BOUNDS")
  })

  it("rejects summon to lane index > 4", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const p1 = state.players[P1]!
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[1]!.instanceId })

    const fresh = engine.getState().players[P1]!.hand
    const result = engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: fresh[0]!.instanceId,
      targetLane: 5,
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("LANE_OUT_OF_BOUNDS")
  })

  it("rejects summon to occupied lane", () => {
    const engine = new GameEngine(createTestState())
    infuseAndSummon(engine, P1, 0)

    // After infuseAndSummon: P1 has 2 cards in hand, 1 resource left
    // Infuse 1 more card to get resources back to 3 (enough to pay cost 3)
    const state = engine.getState()
    const p1 = state.players[P1]!
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[0]!.instanceId })

    // 1 card left in hand — try to summon into lane 0 (occupied)
    const fresh = engine.getState().players[P1]!.hand
    const result = engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: fresh[0]!.instanceId,
      targetLane: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("LANE_OCCUPIED")
  })

  it("allows summon to valid empty lanes (0–4)", () => {
    const engine = new GameEngine(createTestState())

    for (let lane = 0; lane < 5; lane++) {
      const success = infuseAndSummon(engine, P1, lane)
      expect(success).toBe(true)

      // End turn to get more cards
      endFullTurn(engine, P1)
      endFullTurn(engine, P2)
    }

    const finalState = engine.getState()
    const filledLanes = finalState.players[P1]!.battlefield.filter((l) => l.unit !== null)
    expect(filledLanes.length).toBe(5)
  })
})
