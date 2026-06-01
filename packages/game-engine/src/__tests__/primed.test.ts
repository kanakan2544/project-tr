import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType } from "@tcg/shared-types"
import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { P1, P2, SEED } from "./helpers"

const INFERNO_DECK = Array(30).fill("inferno_vanguard") as string[]
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

describe("Primed System", () => {
  it("primedInfuseCount increments to 1 after infusing inferno_vanguard", () => {
    const engine = createEngineWith(INFERNO_DECK, IRON_DECK)

    const hand = engine.getState().players[P1]!.hand
    const vanguardId = hand[0]!.instanceId
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: vanguardId })

    const revolvePile = engine.getState().players[P1]!.revolvePile
    const infused = revolvePile.find((c) => c.instanceId === vanguardId)
    expect(infused).toBeDefined()
    expect(infused!.primedInfuseCount).toBe(1)
  })

  it("summoning inferno_vanguard with primedInfuseCount < 2 results in isPrimed=false", () => {
    const engine = createEngineWith(INFERNO_DECK, IRON_DECK)

    // infuso_vanguard costs 4, infuseValue=2 → need 2 infuses but we infuse a different card first
    // Infuse 2 iron_sentinels if possible... but deck is inferno_vanguard
    // Infuse 2 inferno_vanguards (primedInfuseCount becomes 1 for each)
    infuseCards(engine, P1, 2)

    // Summon the 3rd inferno_vanguard from hand (which has primedInfuseCount=0, condition needs 2)
    const hand = engine.getState().players[P1]!.hand
    engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: hand[0]!.instanceId,
      targetLane: 0,
    })

    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.isPrimed).toBe(false)
    expect(unit.attack).toBe(3)  // base stats unchanged
    expect(unit.maxHealth).toBe(3)
  })

  it("summoning inferno_vanguard with primedInfuseCount=2 results in isPrimed=true with buffed stats", () => {
    const engine = createEngineWith(INFERNO_DECK, IRON_DECK)

    // Manually set a card in hand to have primedInfuseCount=2
    const state = engine.getState()
    const targetCard = state.players[P1]!.hand[4]!  // Last card in hand
    targetCard.primedInfuseCount = 2
    engine.loadState(state)

    // Infuse 2 other cards to get 4 resources (inferno_vanguard costs 4)
    infuseCards(engine, P1, 2)

    // Summon the pre-primed inferno_vanguard
    const hand = engine.getState().players[P1]!.hand
    const primedCard = hand.find((c) => c.primedInfuseCount === 2)!
    const result = engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: primedCard.instanceId,
      targetLane: 0,
    })

    expect(result.success).toBe(true)
    const unit = engine.getState().players[P1]!.battlefield[0]!.unit!
    expect(unit.isPrimed).toBe(true)
    // primedStats: +2 attack, +2 health → 3+2=5
    // primedEffects ON_SUMMON BUFF_ATTACK +1 → 5+1=6
    expect(unit.attack).toBe(6)
    expect(unit.maxHealth).toBe(5)  // 3 + 2 from primedStats
  })

  it("UNIT_PRIMED event emitted when primed condition is met at summon", () => {
    const engine = createEngineWith(INFERNO_DECK, IRON_DECK)

    const state = engine.getState()
    state.players[P1]!.hand[4]!.primedInfuseCount = 2
    engine.loadState(state)

    infuseCards(engine, P1, 2)
    const hand = engine.getState().players[P1]!.hand
    const primedCard = hand.find((c) => c.primedInfuseCount === 2)!

    const result = engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: primedCard.instanceId,
      targetLane: 0,
    })

    expect(result.events?.some((e) => e.type === "UNIT_PRIMED")).toBe(true)
    expect(result.events?.some((e) => e.type === "UNIT_BUFFED")).toBe(true)  // from primedEffect BUFF_ATTACK
  })
})
