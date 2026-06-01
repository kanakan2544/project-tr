import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType, ValidationError } from "@tcg/shared-types"
import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { P1, P2, SEED, endFullTurn } from "./helpers"

const STORM_DECK = Array(30).fill("storm_channeler") as string[]
const IRON_DECK = Array(30).fill("iron_sentinel") as string[]

function createEngineWith(p1Deck: string[], p2Deck: string[]): GameEngine {
  resetIdCounter()
  const state = createInitialGameState("test-match", P1, P2, p1Deck, p2Deck, "cyclone_sovereign", "cyclone_sovereign", SEED)
  return new GameEngine(state)
}

function infuseCards(engine: GameEngine, playerId: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const hand = engine.getState().players[playerId]!.hand
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId, cardInstanceId: hand[0]!.instanceId })
  }
}

// Summon storm_channeler from P1's hand — needs 5 resources (3 infuses = 9 resources if storm_channeler, leftover 4)
function summonStormChanneler(engine: GameEngine, lane = 0): string {
  // infuse 2 from hand first (storm_channeler infuseValue=3, 2×3=6 resources, cost=5, left=1 → not enough for Channel Storm cost 2)
  // Actually infuse 3 cards: 3×3=9 resources, cost=5, left=4 → can activate Channel Storm (cost 2)
  infuseCards(engine, P1, 3)
  const hand = engine.getState().players[P1]!.hand
  engine.dispatch({
    type: ActionType.SUMMON_UNIT,
    playerId: P1,
    cardInstanceId: hand[0]!.instanceId,
    targetLane: lane,
  })
  return engine.getState().players[P1]!.battlefield[lane]!.unit!.instanceId
}

describe("Activated Abilities", () => {
  it("returns ABILITY_NOT_FOUND for out-of-range ability index", () => {
    const engine = createEngineWith(STORM_DECK, IRON_DECK)
    const unitId = summonStormChanneler(engine)

    const result = engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: unitId,
      abilityIndex: 999,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe(ValidationError.ABILITY_NOT_FOUND)
  })

  it("returns INSUFFICIENT_RESOURCES when player cannot afford ability", () => {
    const engine = createEngineWith(STORM_DECK, IRON_DECK)

    // Infuse 2 cards only: 2×3=6 resources, summon (cost 5) → 1 resource left
    // Channel Storm costs 2 → insufficient
    infuseCards(engine, P1, 2)
    const hand = engine.getState().players[P1]!.hand
    engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: hand[0]!.instanceId,
      targetLane: 0,
    })
    const unitId = engine.getState().players[P1]!.battlefield[0]!.unit!.instanceId

    const result = engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: unitId,
      abilityIndex: 0,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe(ValidationError.INSUFFICIENT_RESOURCES)
  })

  it("Channel Storm deals 2 damage to enemy player", () => {
    const engine = createEngineWith(STORM_DECK, IRON_DECK)
    const unitId = summonStormChanneler(engine)

    const p2LifeBefore = engine.getState().players[P2]!.life

    const result = engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: unitId,
      abilityIndex: 0,
    })

    expect(result.success).toBe(true)
    expect(engine.getState().players[P2]!.life).toBe(p2LifeBefore - 2)
    expect(result.events?.some((e) => e.type === "ABILITY_ACTIVATED")).toBe(true)
    expect(result.events?.some((e) => e.type === "PLAYER_DAMAGED")).toBe(true)
  })

  it("returns ABILITY_ALREADY_USED on second activation same turn (oncePerTurn)", () => {
    const engine = createEngineWith(STORM_DECK, IRON_DECK)
    const unitId = summonStormChanneler(engine)

    // First activation — succeeds
    engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: unitId,
      abilityIndex: 0,
    })

    // Second activation — fails
    const result = engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: unitId,
      abilityIndex: 0,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe(ValidationError.ABILITY_ALREADY_USED)
  })

  it("returns INVALID_TARGET when unit is silenced", () => {
    const engine = createEngineWith(STORM_DECK, IRON_DECK)
    const unitId = summonStormChanneler(engine)

    // Silence the unit via loadState
    const state = engine.getState()
    const unit = state.players[P1]!.battlefield[0]!.unit!
    unit.status.silenced = true
    engine.loadState(state)

    const result = engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: unitId,
      abilityIndex: 0,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe(ValidationError.INVALID_TARGET)
  })

  it("abilitiesUsedThisTurn resets at START_TURN — ability can be used again next turn", () => {
    const engine = createEngineWith(STORM_DECK, IRON_DECK)
    const unitId = summonStormChanneler(engine)

    // Use ability this turn
    engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: unitId,
      abilityIndex: 0,
    })

    // End P1's turn → P2's turn → back to P1's turn
    endFullTurn(engine, P1)
    endFullTurn(engine, P2)

    // P1's new turn — abilitiesUsedThisTurn should be reset
    // But we need resources again — infuse 2 cards (2×3=6, Channel Storm costs 2)
    infuseCards(engine, P1, 2)

    const freshUnitId = engine.getState().players[P1]!.battlefield[0]!.unit!.instanceId
    const result = engine.dispatch({
      type: ActionType.ACTIVATE_ABILITY,
      playerId: P1,
      unitInstanceId: freshUnitId,
      abilityIndex: 0,
    })

    expect(result.success).toBe(true)
  })
})
