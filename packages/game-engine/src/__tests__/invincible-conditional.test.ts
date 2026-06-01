import { describe, it, expect } from "vitest"
import { ActionType, Keyword } from "@tcg/shared-types"
import { createEngineWithCard, P1, P2 } from "./helpers-invincible"

/** Force revolveCount to N by loading a modified state */
function setRevolveCount(engine: ReturnType<typeof createEngineWithCard>, count: number): void {
  const state = engine.getState()
  engine.loadState({
    ...state,
    players: {
      ...state.players,
      [P1]: { ...state.players[P1]!, revolveCount: count },
    },
  })
}

describe("oliver_grayson — primedKeywords (Evasion)", () => {
  it("does not have Evasion before revolve (revolveCount=0)", () => {
    const engine = createEngineWithCard("oliver_grayson", 10)
    const state = engine.getState()
    const card = state.players[P1]!.hand.find((c) => c.cardId === "oliver_grayson")!
    const result = engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: card.instanceId, targetLane: 0 })
    expect(result.success).toBe(true)

    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.keywords).not.toContain(Keyword.Evasion)
    expect(unit.isPrimed).toBe(false)
  })

  it("gains Evasion when summoned with revolveCount >= 1", () => {
    const engine = createEngineWithCard("oliver_grayson", 10)
    // Set revolveCount first
    setRevolveCount(engine, 1)

    const card = engine.getState().players[P1]!.hand.find((c) => c.cardId === "oliver_grayson")!
    const result = engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: card.instanceId, targetLane: 0 })
    expect(result.success).toBe(true)

    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.isPrimed).toBe(true)
    expect(unit.keywords).toContain(Keyword.Evasion)
  })

  it("gains Evasion mid-battlefield when revolve triggers while Oliver is on board", () => {
    const engine = createEngineWithCard("oliver_grayson", 10)
    // Summon oliver at revolveCount=0 (no Evasion yet)
    const card = engine.getState().players[P1]!.hand.find((c) => c.cardId === "oliver_grayson")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: card.instanceId, targetLane: 0 })

    // Now simulate revolve by setting revolveCount and dispatching an end-turn (triggers evaluateBattlefieldPrimed)
    // We can use loadState + inject an empty deck to trigger revolve on next draw
    const s = engine.getState()
    engine.loadState({
      ...s,
      players: {
        ...s.players,
        [P1]: { ...s.players[P1]!, deck: [], revolvePile: [s.players[P1]!.deck[0]!] },
      },
    })

    // End P1's main phase — triggers revolve on END_TURN draw
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
    // Handle END_TURN_SELECT if needed
    const state2 = engine.getState()
    if (state2.activePlayer === P1 && state2.phase === "END_TURN_SELECT") {
      const hand2 = state2.players[P1]!.hand
      const keepIds = hand2.slice(0, 2).map((c) => c.instanceId)
      engine.dispatch({ type: ActionType.END_TURN_SELECT, playerId: P1, keepInstanceIds: keepIds })
    }

    const finalState = engine.getState()
    // If game ended or player changed — check oliver on battlefield
    const oliver = finalState.players[P1]!.battlefield[0]?.unit
    if (oliver && oliver.cardId === "oliver_grayson") {
      expect(oliver.isPrimed).toBe(true)
      expect(oliver.keywords).toContain(Keyword.Evasion)
    }
  })
})

describe("invincible — primedStats + primedKeywords (+1/+1, QuickAttack)", () => {
  it("vanilla stats/keywords before first revolve", () => {
    const engine = createEngineWithCard("invincible", 10)
    const card = engine.getState().players[P1]!.hand.find((c) => c.cardId === "invincible")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: card.instanceId, targetLane: 0 })

    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.isPrimed).toBe(false)
    expect(unit.attack).toBe(5)
    expect(unit.maxHealth).toBe(5)
    expect(unit.keywords).not.toContain(Keyword.QuickAttack)
  })

  it("gains +1/+1 and QuickAttack when summoned with revolveCount >= 1", () => {
    const engine = createEngineWithCard("invincible", 10)
    setRevolveCount(engine, 1)

    const card = engine.getState().players[P1]!.hand.find((c) => c.cardId === "invincible")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: card.instanceId, targetLane: 0 })

    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.isPrimed).toBe(true)
    expect(unit.attack).toBe(6)    // 5 + 1
    expect(unit.maxHealth).toBe(6)  // 5 + 1
    expect(unit.keywords).toContain(Keyword.QuickAttack)
  })
})

describe("omni_man — Piercing keyword after first revolve", () => {
  it("vanilla before revolve", () => {
    const engine = createEngineWithCard("omni_man", 10)
    const card = engine.getState().players[P1]!.hand.find((c) => c.cardId === "omni_man")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: card.instanceId, targetLane: 0 })

    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.isPrimed).toBe(false)
    expect(unit.attack).toBe(6)
    expect(unit.maxHealth).toBe(7)
    expect(unit.keywords).not.toContain(Keyword.Piercing)
  })

  it("gains +2/+2 and Piercing at revolveCount >= 1", () => {
    const engine = createEngineWithCard("omni_man", 10)
    setRevolveCount(engine, 1)

    const card = engine.getState().players[P1]!.hand.find((c) => c.cardId === "omni_man")!
    engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: card.instanceId, targetLane: 0 })

    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.isPrimed).toBe(true)
    expect(unit.attack).toBe(8)    // 6 + 2
    expect(unit.maxHealth).toBe(9)  // 7 + 2
    expect(unit.keywords).toContain(Keyword.Piercing)
  })
})
