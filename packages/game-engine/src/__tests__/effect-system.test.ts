import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType } from "@tcg/shared-types"
import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { P1, P2, SEED, endFullTurn } from "./helpers"

const EMBER_SEER_DECK = Array(30).fill("ember_seer") as string[]
const GRAVE_SENTINEL_DECK = Array(30).fill("grave_sentinel") as string[]
const FLAME_DECK = Array(30).fill("flame_vanguard") as string[]
const STORM_DECK = Array(30).fill("storm_channeler") as string[]
const IRON_DECK = Array(30).fill("iron_sentinel") as string[]

function createEngineWith(p1Deck: string[], p2Deck: string[]): GameEngine {
  resetIdCounter()
  const state = createInitialGameState("test-match", P1, P2, p1Deck, p2Deck, "cyclone_sovereign", "cyclone_sovereign", SEED)
  return new GameEngine(state)
}

// Infuse N cards to gain resources, returns updated engine
function infuseCards(engine: GameEngine, playerId: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const hand = engine.getState().players[playerId]!.hand
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId, cardInstanceId: hand[0]!.instanceId })
  }
}

describe("Effect System", () => {
  describe("ON_SUMMON", () => {
    it("ember_seer ON_SUMMON deals 2 damage to enemy player", () => {
      const engine = createEngineWith(EMBER_SEER_DECK, IRON_DECK)

      const p2LifeBefore = engine.getState().players[P2]!.life

      // 2 infuses × 2 resources = 4 resources (ember_seer costs 4)
      infuseCards(engine, P1, 2)
      const hand = engine.getState().players[P1]!.hand
      const result = engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P1,
        cardInstanceId: hand[0]!.instanceId,
        targetLane: 0,
      })

      expect(result.success).toBe(true)
      expect(engine.getState().players[P2]!.life).toBe(p2LifeBefore - 2)
    })

    it("ON_SUMMON emits EFFECT_TRIGGERED event", () => {
      const engine = createEngineWith(EMBER_SEER_DECK, IRON_DECK)

      infuseCards(engine, P1, 2)
      const hand = engine.getState().players[P1]!.hand
      const result = engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P1,
        cardInstanceId: hand[0]!.instanceId,
        targetLane: 0,
      })

      expect(result.events?.some((e) => e.type === "EFFECT_TRIGGERED")).toBe(true)
    })
  })

  describe("ON_DESTROY", () => {
    it("grave_sentinel ON_DESTROY draws a card for owner when killed in combat", () => {
      // P1 deck: grave_sentinel (2/4, ON_DESTROY draw)
      // P2 deck: flame_vanguard (4/3, Dash) — Dash means no standBy, attacks same turn summoned
      // flame_vanguard attack=4 kills grave_sentinel (health=4) immediately
      const engine = createEngineWith(GRAVE_SENTINEL_DECK, FLAME_DECK)

      // P1: infuse 2 (4 resources), summon grave_sentinel (cost 3) in lane 0
      infuseCards(engine, P1, 2)
      const p1Hand1 = engine.getState().players[P1]!.hand
      engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P1,
        cardInstanceId: p1Hand1[0]!.instanceId,
        targetLane: 0,
      })

      // End P1's turn (hand=2, auto-proceed)
      endFullTurn(engine, P1)

      // P2: infuse 2 (4 resources), summon flame_vanguard (cost 3, Dash → no standBy) in lane 0
      infuseCards(engine, P2, 2)
      const p2Hand = engine.getState().players[P2]!.hand
      engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P2,
        cardInstanceId: p2Hand[0]!.instanceId,
        targetLane: 0,
      })

      // Verify flame_vanguard has no standBy (Dash)
      expect(engine.getState().players[P2]!.battlefield[0]!.unit!.status.standBy).toBe(false)

      // P2 ends turn → combat → flame_vanguard (4 atk, Dash) kills grave_sentinel (4 hp) → ON_DESTROY fires → P1 draws
      const endMainResult = engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P2 })

      // Check CARDS_DRAWN event for P1 exists (from ON_DESTROY trigger)
      const cardsDrawnForP1 = endMainResult.events?.filter(
        (e) => e.type === "CARDS_DRAWN" && (e as { type: "CARDS_DRAWN"; playerId: string }).playerId === P1
      )
      expect(cardsDrawnForP1?.length).toBeGreaterThan(0)
    })
  })

  describe("ON_ATTACK", () => {
    it("storm_channeler ON_ATTACK buffs own attack by 1 after attacking", () => {
      const engine = createEngineWith(STORM_DECK, IRON_DECK)

      // 3 infuses × 3 resources = 9 resources (storm_channeler costs 5)
      infuseCards(engine, P1, 3)
      const hand = engine.getState().players[P1]!.hand
      engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P1,
        cardInstanceId: hand[0]!.instanceId,
        targetLane: 0,
      })

      // storm_channeler has standBy — must wait a turn
      endFullTurn(engine, P1)  // P2's turn starts
      endFullTurn(engine, P2)  // P1's turn starts, storm_channeler.standBy cleared

      // Check standBy cleared
      expect(engine.getState().players[P1]!.battlefield[0]!.unit!.status.standBy).toBe(false)

      // storm_channeler has attack=3 before combat
      expect(engine.getState().players[P1]!.battlefield[0]!.unit!.attack).toBe(3)

      // P1 ends main phase → combat → storm_channeler attacks directly (no P2 unit in lane 0)
      // ON_ATTACK fires → BUFF_ATTACK +1 → attack becomes 4
      endFullTurn(engine, P1)

      // After combat, P1's battlefield still has storm_channeler (no counter-attack on direct)
      const unit = engine.getState().players[P1]!.battlefield[0]!.unit
      expect(unit).not.toBeNull()
      expect(unit!.attack).toBe(4)
    })
  })
})
