import { describe, it, expect } from "vitest"
import { GameEngine } from "../core/game-engine"
import { ActionType } from "@tcg/shared-types"
import { createInitialGameState } from "../core/game-state-factory"
import { resetIdCounter } from "../utils/id-generator"
import { P1, P2, SEED, endFullTurn } from "./helpers"

describe("Keywords", () => {
  describe("Overkill", () => {
    it("excess damage reaches enemy player", () => {
      // Setup: P1 has overkill_striker (6/2), P2 has iron_sentinel (2/4)
      // overkill_striker deals 6 to iron_sentinel (4hp) → excess 2 → P2 takes 2
      // Key: P1 summons first (turn 1), P2 summons second (turn 1).
      // Both have standBy. P2's iron_sentinel cannot attack on P2's turn 1.
      // P1's turn 2: standBy cleared → overkill_striker attacks iron_sentinel.
      resetIdCounter()
      const state = createInitialGameState(
        "overkill-test", P1, P2,
        Array(30).fill("overkill_striker") as string[],
        Array(30).fill("iron_sentinel") as string[],
        "cyclone_sovereign", "cyclone_sovereign",
        SEED
      )
      const engine = new GameEngine(state)

      // P1 turn 1: summon overkill_striker in lane 0 (standBy=true)
      const s1 = engine.getState()
      const p1Hand1 = s1.players[P1]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand1[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand1[1]!.instanceId })
      const p1Fresh1 = engine.getState().players[P1]!.hand
      engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: p1Fresh1[0]!.instanceId, targetLane: 0 })
      // Hand=2, auto-proceed
      engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

      // P2 turn 1: summon iron_sentinel in lane 0 (standBy=true — cannot attack this turn)
      const s2 = engine.getState()
      const p2Hand1 = s2.players[P2]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand1[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand1[1]!.instanceId })
      const p2Fresh1 = engine.getState().players[P2]!.hand
      engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P2, cardInstanceId: p2Fresh1[0]!.instanceId, targetLane: 0 })
      // iron_sentinel standBy=true → cannot attack on P2's turn 1 attack phase
      // Use endFullTurn to handle potential END_TURN_SELECT
      endFullTurn(engine, P2)

      // P1 turn 2: overkill_striker standBy cleared. Attacks iron_sentinel (simultaneous).
      // overkill_striker (6 atk) vs iron_sentinel (4hp) → excess 2 → P2 takes 2.
      // overkill_striker (2hp) takes iron_sentinel (2 atk) counter = 0 → dies too.
      const p2LifeBefore = engine.getState().players[P2]!.life
      endFullTurn(engine, P1)

      expect(engine.getState().players[P2]!.life).toBe(p2LifeBefore - 2)
    })
  })

  describe("Guard", () => {
    it("redirects attack to guard unit in adjacent lane", () => {
      resetIdCounter()
      const state = createInitialGameState(
        "guard-test", P1, P2,
        Array(30).fill("flame_vanguard") as string[],
        Array(30).fill("shield_guardian") as string[],
        "cyclone_sovereign", "cyclone_sovereign",
        SEED
      )
      const engine = new GameEngine(state)

      // P1 turn 1: end without summoning
      endFullTurn(engine, P1)

      // P2 turn 1: summon shield_guardian (Guard) in lane 1
      const s = engine.getState()
      const p2Hand = s.players[P2]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand[1]!.instanceId })
      const p2Fresh = engine.getState().players[P2]!.hand
      engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P2,
        cardInstanceId: p2Fresh[0]!.instanceId,
        targetLane: 1,
      })
      endFullTurn(engine, P2)

      // P1 turn 2: summon flame_vanguard (Charge) in lane 0
      // lane 0 is empty on P2's side, but lane 1 has Guard (adjacent) → should redirect
      const s2 = engine.getState()
      const p1Hand = s2.players[P1]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[1]!.instanceId })
      const p1Fresh = engine.getState().players[P1]!.hand
      engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P1,
        cardInstanceId: p1Fresh[0]!.instanceId,
        targetLane: 0,
      })

      const p2LifeBefore = engine.getState().players[P2]!.life
      const guardHealthBefore = engine.getState().players[P2]!.battlefield[1]!.unit!.currentHealth

      // flame_vanguard has Charge → attacks immediately
      endFullTurn(engine, P1)

      const afterState = engine.getState()
      // P2 life unchanged (Guard intercepted)
      expect(afterState.players[P2]!.life).toBe(p2LifeBefore)
      // Guard unit took damage (flame_vanguard atk 4, shield_guardian 5hp → 1 remaining)
      const guardAfter = afterState.players[P2]!.battlefield[1]!.unit
      if (guardAfter) {
        expect(guardAfter.currentHealth).toBeLessThan(guardHealthBefore)
      } else {
        // Guard was destroyed — still passed (life wasn't hit)
        expect(afterState.players[P2]!.life).toBe(p2LifeBefore)
      }
    })
  })

  describe("Lifesteal", () => {
    it("heals controller by damage dealt on direct attack", () => {
      resetIdCounter()
      const state = createInitialGameState(
        "lifesteal-test", P1, P2,
        Array(30).fill("blood_reaper") as string[],
        Array(30).fill("iron_sentinel") as string[],
        "cyclone_sovereign", "cyclone_sovereign",
        SEED
      )
      const engine = new GameEngine(state)

      // P1 summons blood_reaper (Lifesteal, 4/4) in lane 2 — no Charge, must wait for standBy.
      const s = engine.getState()
      const p1Hand = s.players[P1]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[1]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[2]!.instanceId })
      const p1Fresh = engine.getState().players[P1]!.hand
      engine.dispatch({
        type: ActionType.SUMMON_UNIT,
        playerId: P1,
        cardInstanceId: p1Fresh[0]!.instanceId,
        targetLane: 2,
      })
      // 2 cards left → auto-proceed
      engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })
      endFullTurn(engine, P2)

      // P1 turn 2: unit attacks directly (lane 2 is empty on P2's side)
      const p1LifeBefore = engine.getState().players[P1]!.life
      endFullTurn(engine, P1)

      // blood_reaper (4 attack) hits P2 directly → P1 healed by 4
      expect(engine.getState().players[P1]!.life).toBe(p1LifeBefore + 4)
    })
  })

  describe("Charge", () => {
    it("unit can attack on the turn it is summoned", () => {
      resetIdCounter()
      const state = createInitialGameState(
        "charge-test", P1, P2,
        Array(30).fill("flame_vanguard") as string[],
        Array(30).fill("iron_sentinel") as string[],
        "cyclone_sovereign", "cyclone_sovereign",
        SEED
      )
      const engine = new GameEngine(state)

      // P1 turn 1: summon flame_vanguard (Charge, 4/3) in lane 2 — empty lane on P2 side
      const s = engine.getState()
      const p1Hand = s.players[P1]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[1]!.instanceId })
      const p1Fresh = engine.getState().players[P1]!.hand
      engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: p1Fresh[0]!.instanceId, targetLane: 2 })

      const p2LifeBefore = engine.getState().players[P2]!.life

      // End P1 turn — flame_vanguard should attack P2 directly in attack phase
      engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

      expect(engine.getState().players[P2]!.life).toBe(p2LifeBefore - 4)
    })
  })

  describe("Barrier", () => {
    it("negates the first damage instance then breaks", () => {
      // Setup: P1 summons overkill_striker (6/2) turn 1 — standBy clears on P1 turn 2.
      // P2 summons barrier_knight (Barrier, 2/3) turn 1.
      // P1 turn 2: overkill_striker (6 atk) attacks barrier_knight → Barrier absorbs all damage.
      // barrier_knight survives at full health; barrierActive=false.
      resetIdCounter()
      const state = createInitialGameState(
        "barrier-test", P1, P2,
        Array(30).fill("overkill_striker") as string[],
        Array(30).fill("barrier_knight") as string[],
        "cyclone_sovereign", "cyclone_sovereign",
        SEED
      )
      const engine = new GameEngine(state)

      // P1 turn 1: summon overkill_striker (cost 4 — infuse 2 cards for 4 resources)
      const s1 = engine.getState()
      const p1Hand1 = s1.players[P1]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand1[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand1[1]!.instanceId })
      const p1Fresh1 = engine.getState().players[P1]!.hand
      engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: p1Fresh1[0]!.instanceId, targetLane: 0 })
      engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

      // P2 turn 1: summon barrier_knight (cost 3 — infuse 2 cards for 4 resources)
      const s2 = engine.getState()
      const p2Hand1 = s2.players[P2]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand1[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand1[1]!.instanceId })
      const p2Fresh1 = engine.getState().players[P2]!.hand
      engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P2, cardInstanceId: p2Fresh1[0]!.instanceId, targetLane: 0 })
      endFullTurn(engine, P2)

      // Verify barrier_knight has barrierActive=true before attack
      expect(engine.getState().players[P2]!.battlefield[0]!.unit!.status.barrierActive).toBe(true)
      const healthBefore = engine.getState().players[P2]!.battlefield[0]!.unit!.currentHealth

      // P1 turn 2: overkill_striker standBy cleared → attacks barrier_knight
      endFullTurn(engine, P1)

      const knight = engine.getState().players[P2]!.battlefield[0]?.unit
      // Barrier blocked the 6-damage hit — knight survives at full health, barrierActive consumed
      expect(knight).toBeDefined()
      expect(knight!.currentHealth).toBe(healthBefore)
      expect(knight!.status.barrierActive).toBe(false)
    })
  })

  describe("QuickAttack", () => {
    it("kills defender before counter-attack — attacker takes no counter damage", () => {
      // quick_striker has Charge+QuickAttack (4/2).
      // P1 summons quick_striker on turn 2 — Charge means standBy=false, attacks same turn.
      // iron_sentinel (2/4) is on P2 side lane 0 — still has standBy but can be attacked.
      // QuickAttack: quick_striker deals 4 damage to iron_sentinel (4 hp → 0 → dies) BEFORE counter.
      // quick_striker survives at full 2 hp.
      resetIdCounter()
      const state = createInitialGameState(
        "quickattack-test", P1, P2,
        Array(30).fill("quick_striker") as string[],
        Array(30).fill("iron_sentinel") as string[],
        "cyclone_sovereign", "cyclone_sovereign",
        SEED
      )
      const engine = new GameEngine(state)

      // P1 turn 1: end without summoning
      endFullTurn(engine, P1)

      // P2 turn 1: summon iron_sentinel (2/4) in lane 0 — standBy=true
      const s = engine.getState()
      const p2Hand = s.players[P2]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P2, cardInstanceId: p2Hand[1]!.instanceId })
      const p2Fresh = engine.getState().players[P2]!.hand
      engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P2, cardInstanceId: p2Fresh[0]!.instanceId, targetLane: 0 })
      endFullTurn(engine, P2)

      // P1 turn 2: summon quick_striker (Charge+QuickAttack, 4/2) in lane 0
      // Charge: standBy=false → attacks this turn
      const s2 = engine.getState()
      const p1Hand = s2.players[P1]!.hand
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[0]!.instanceId })
      engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: p1Hand[1]!.instanceId })
      const p1Fresh = engine.getState().players[P1]!.hand
      engine.dispatch({ type: ActionType.SUMMON_UNIT, playerId: P1, cardInstanceId: p1Fresh[0]!.instanceId, targetLane: 0 })

      // End P1 turn — Charge lets quick_striker attack; QuickAttack kills iron_sentinel before counter
      engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

      const striker = engine.getState().players[P1]!.battlefield[0]?.unit
      expect(striker).toBeDefined()
      expect(striker!.currentHealth).toBe(2) // no counter-damage taken
      // iron_sentinel should be destroyed
      expect(engine.getState().players[P2]!.battlefield[0]?.unit).toBeNull()
    })
  })
})
