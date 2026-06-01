import { describe, it, expect } from "vitest"
import { ActionType } from "@tcg/shared-types"
import { createEngineWithCard, P1, P2 } from "./helpers-invincible"

describe("Cecil Stedman — aura system", () => {
  it("adjacent ally base attack is 2 at revolveCount=0 (no aura bonus)", () => {
    const engine = createEngineWithCard("cecil_stedman", 10)
    const state = engine.getState()

    // Summon an iron_sentinel in lane 1 first
    const sentinel = state.players[P1]!.hand.find((c) => c.cardId === "iron_sentinel")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: sentinel.instanceId, targetLane: 1 })

    // Summon Cecil in lane 0 (adjacent to lane 1)
    const cecilCard = engine.getState().players[P1]!.hand.find((c) => c.cardId === "cecil_stedman")!
    const result = engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: cecilCard.instanceId, targetLane: 0 })
    expect(result.success).toBe(true)

    const afterState = engine.getState()
    const sentinelUnit = afterState.players[P1]!.battlefield[1]!.unit!
    // revolveCount=0 → bonus = 3 * 0 = 0, iron_sentinel base attack = 2
    expect(sentinelUnit.attack).toBe(2)
    expect((sentinelUnit.flags.auraAttack as number | undefined) ?? 0).toBe(0)
  })

  it("adjacent ally gains +3 per revolveCount when Cecil is on board", () => {
    const engine = createEngineWithCard("cecil_stedman", 10)

    // Set revolveCount=2 → bonus should be 3*2=6
    const s0 = engine.getState()
    engine.loadState({
      ...s0,
      players: { ...s0.players, [P1]: { ...s0.players[P1]!, revolveCount: 2 } },
    })

    const s1 = engine.getState()
    const sentinel = s1.players[P1]!.hand.find((c) => c.cardId === "iron_sentinel")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: sentinel.instanceId, targetLane: 1 })

    const cecilCard = engine.getState().players[P1]!.hand.find((c) => c.cardId === "cecil_stedman")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: cecilCard.instanceId, targetLane: 0 })

    const afterState = engine.getState()
    const sentinelUnit = afterState.players[P1]!.battlefield[1]!.unit!
    // attack = base 2 + aura bonus 6
    expect(sentinelUnit.attack).toBe(8)
    expect(sentinelUnit.flags.auraAttack as number).toBe(6)
  })

  it("non-adjacent unit (lane 4) does not receive aura from Cecil in lane 0", () => {
    const engine = createEngineWithCard("cecil_stedman", 10)
    const s = engine.getState()
    engine.loadState({
      ...s,
      players: { ...s.players, [P1]: { ...s.players[P1]!, revolveCount: 3 } },
    })

    const sentinel = engine.getState().players[P1]!.hand.find((c) => c.cardId === "iron_sentinel")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: sentinel.instanceId, targetLane: 4 })

    const cecilCard = engine.getState().players[P1]!.hand.find((c) => c.cardId === "cecil_stedman")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: cecilCard.instanceId, targetLane: 0 })

    const sentinelUnit = engine.getState().players[P1]!.battlefield[4]!.unit!
    // Lane 4 is not adjacent to lane 0 — base attack only
    expect(sentinelUnit.attack).toBe(2)
    expect((sentinelUnit.flags.auraAttack as number | undefined) ?? 0).toBe(0)
  })

  it("aura is idempotent across multiple dispatches", () => {
    const engine = createEngineWithCard("cecil_stedman", 10)
    const s = engine.getState()
    engine.loadState({
      ...s,
      players: { ...s.players, [P1]: { ...s.players[P1]!, revolveCount: 1 } },
    })

    const sentinel = engine.getState().players[P1]!.hand.find((c) => c.cardId === "iron_sentinel")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: sentinel.instanceId, targetLane: 1 })

    const cecilCard = engine.getState().players[P1]!.hand.find((c) => c.cardId === "cecil_stedman")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: cecilCard.instanceId, targetLane: 0 })

    // Dispatch a no-op action (infuse a card) and recheck
    const hand = engine.getState().players[P1]!.hand
    if (hand.length > 0) {
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[0]!.instanceId })
    }

    const finalState = engine.getState()
    const sentinelUnit = finalState.players[P1]!.battlefield[1]!.unit
    if (sentinelUnit) {
      // revolveCount=1 → bonus = 3*1 = 3 — should not have doubled
      expect(sentinelUnit.attack).toBe(5) // 2 + 3
      expect(sentinelUnit.flags.auraAttack as number).toBe(3)
    }
  })
})
