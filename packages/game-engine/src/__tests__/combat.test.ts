import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType } from "@tcg/shared-types"
import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { createTestState, P1, P2, SEED, endFullTurn } from "./helpers"

function summonWithDash(engine: GameEngine, playerId: string, lane: number): void {
  const s = engine.getState()
  const hand = s.players[playerId]!.hand
  engine.dispatch({ type: ActionType.INFUSE_CARD, playerId, cardInstanceId: hand[0]!.instanceId })
  engine.dispatch({ type: ActionType.INFUSE_CARD, playerId, cardInstanceId: hand[1]!.instanceId })
  const fresh = engine.getState().players[playerId]!.hand
  engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId, cardInstanceId: fresh[0]!.instanceId, targetLane: lane })
}

describe("Combat", () => {
  it("unit with Stand By does not attack on summon turn", () => {
    const engine = new GameEngine(createTestState())
    const state = engine.getState()
    const p1 = state.players[P1]!

    // Summon iron_sentinel (no Dash) in lane 0 — infuse 2, hand drops to 3
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[1]!.instanceId })
    const fresh = engine.getState().players[P1]!.hand
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: fresh[0]!.instanceId, targetLane: 0 })

    // standBy should be true
    expect(engine.getState().players[P1]!.battlefield[0]!.unit!.status.standBy).toBe(true)

    const p2LifeBefore = engine.getState().players[P2]!.life
    // Hand is now 2 (3 - 1 summoned) — auto-proceed end turn
    endFullTurn(engine, P1)

    // P2 life should be unchanged (unit couldn't attack)
    expect(engine.getState().players[P2]!.life).toBe(p2LifeBefore)
  })

  it("unit with Dash attacks on summon turn", () => {
    resetIdCounter()
    const state = createInitialGameState(
      "dash-test", P1, P2,
      Array(30).fill("flame_vanguard") as string[],
      Array(30).fill("iron_sentinel") as string[],
      "cyclone_sovereign", "cyclone_sovereign",
      SEED
    )
    const engine = new GameEngine(state)
    summonWithDash(engine, P1, 0)

    expect(engine.getState().players[P1]!.battlefield[0]!.unit!.status.standBy).toBe(false)

    const p2LifeBefore = engine.getState().players[P2]!.life
    // After summon, hand is 3 (5 - 2 infused - 1 summoned = 2, auto-proceed)
    endFullTurn(engine, P1)

    // flame_vanguard (attack 4) attacks direct
    expect(engine.getState().players[P2]!.life).toBe(p2LifeBefore - 4)
  })

  it("Stand By is cleared on next turn, unit attacks then", () => {
    const engine = new GameEngine(createTestState())
    const s = engine.getState()
    const p1 = s.players[P1]!

    // Summon, then infuse more to get to ≤2 in hand for auto-proceed
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1.hand[1]!.instanceId })
    const fresh = engine.getState().players[P1]!.hand
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: fresh[0]!.instanceId, targetLane: 0 })

    // Hand = 2, auto-proceed
    endFullTurn(engine, P1)
    endFullTurn(engine, P2)

    // P1's second turn — standBy should be cleared
    const nextTurn = engine.getState()
    expect(nextTurn.players[P1]!.battlefield[0]!.unit!.status.standBy).toBe(false)

    const p2LifeBefore = nextTurn.players[P2]!.life
    endFullTurn(engine, P1)

    // iron_sentinel (attack 2) attacks direct
    expect(engine.getState().players[P2]!.life).toBe(p2LifeBefore - 2)
  })

  it("direct attack reduces opponent life when opposing lane is empty", () => {
    resetIdCounter()
    const state = createInitialGameState(
      "direct-test", P1, P2,
      Array(30).fill("flame_vanguard") as string[],
      Array(30).fill("iron_sentinel") as string[],
      "cyclone_sovereign", "cyclone_sovereign",
      SEED
    )
    const engine = new GameEngine(state)
    summonWithDash(engine, P1, 2)

    const lifeBefore = engine.getState().players[P2]!.life
    endFullTurn(engine, P1)

    expect(engine.getState().players[P2]!.life).toBe(lifeBefore - 4)
  })
})
