import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType } from "@tcg/shared-types"
import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { P1, P2, SEED, endFullTurn } from "./helpers"

function createStandardEngine(): GameEngine {
  resetIdCounter()
  const state = createInitialGameState(
    "revolve-test", P1, P2,
    Array(30).fill("iron_sentinel") as string[],
    Array(30).fill("iron_sentinel") as string[],
    "cyclone_sovereign", "cyclone_sovereign",
    SEED
  )
  return new GameEngine(state)
}

describe("Revolve System", () => {
  it("draws normally from non-empty deck", () => {
    const engine = createStandardEngine()
    const before = engine.getState().players[P1]!
    expect(before.hand.length).toBe(5)
    expect(before.deck.length).toBe(25) // 30 - 5 drawn initially
  })

  it("triggers Revolve when deck empties", () => {
    const engine = createStandardEngine()
    let revolveTriggered = false

    // P1 infuses all 5 cards each turn → draws 5 from deck.
    // P1 deck = 25 cards. After 5 P1 turns, deck empty → revolve triggers on turn 6.
    // Run 14 iterations (7 P1 turns, 7 P2 turns alternating).
    for (let i = 0; i < 14; i++) {
      const s = engine.getState()
      if (s.winner !== null || s.isDraw) break

      if (s.activePlayer === P1) {
        const hand = [...s.players[P1]!.hand]
        for (const card of hand) {
          const cur = engine.getState()
          if (cur.phase !== "MAIN_PHASE" || cur.activePlayer !== P1) break
          engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: card.instanceId })
        }
        const result = engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
        if (result.events?.some((e) => e.type === "REVOLVE_TRIGGERED" && e.playerId === P1)) {
          revolveTriggered = true
        }
      } else {
        endFullTurn(engine, P2)
      }
    }

    expect(revolveTriggered).toBe(true)
  })

  it("revolveCount increments on each Revolve", () => {
    const engine = createStandardEngine()

    for (let i = 0; i < 14; i++) {
      const s = engine.getState()
      if (s.winner !== null || s.isDraw) break
      if (s.activePlayer === P1) {
        const hand = [...s.players[P1]!.hand]
        for (const card of hand) {
          const cur = engine.getState()
          if (cur.phase !== "MAIN_PHASE" || cur.activePlayer !== P1) break
          engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: card.instanceId })
        }
        engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
      } else {
        endFullTurn(engine, P2)
      }
    }

    expect(engine.getState().players[P1]!.revolveCount).toBeGreaterThanOrEqual(1)
  })

  it("Ace is blocked before first Revolve", () => {
    const engine = createStandardEngine()
    const s = engine.getState()
    const aceInst = s.players[P1]!.ace!

    // Give enough resources (infuse 4 cards → 8 resources, ace costs 7)
    const hand = s.players[P1]!.hand
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[1]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[2]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[3]!.instanceId })

    const result = engine.dispatch({
      type: ActionType.SUMMON_UNIT,
      playerId: P1,
      cardInstanceId: aceInst.instanceId,
      targetLane: 0,
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe("ACE_NOT_UNLOCKED")
  })

  it("fatigue deals damage when both deck and revolve pile empty", () => {
    // Directly load a state where P1 has empty deck and empty revolve pile.
    // Drawing should trigger fatigue.
    resetIdCounter()
    const baseState = createInitialGameState(
      "fatigue-test", P1, P2,
      Array(30).fill("iron_sentinel") as string[],
      Array(30).fill("iron_sentinel") as string[],
      "cyclone_sovereign", "cyclone_sovereign",
      SEED
    )
    const engine = new GameEngine(baseState)

    // Drain P1's deck and revolve pile by manipulating state
    const s = engine.getState()
    const modified = JSON.parse(JSON.stringify(s)) as typeof s
    const p1 = modified.players[P1]!
    // Move all deck and revolve cards to discard (simulate cards being permanently removed)
    p1.discardPile.push(...p1.deck, ...p1.revolvePile)
    p1.deck = []
    p1.revolvePile = []
    // Keep only 1 card in hand so draw is attempted but nothing available
    p1.hand = p1.hand.slice(0, 1)
    engine.loadState(modified)

    // P1 ends main phase (1 card in hand → auto-proceed)
    // End turn triggers draw until 5 cards, but deck and revolve pile empty → fatigue x4
    const result = engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
    const fatigueEvents = result.events?.filter((e) => e.type === "FATIGUE_DAMAGE") ?? []

    expect(fatigueEvents.length).toBeGreaterThan(0)
  })
})
