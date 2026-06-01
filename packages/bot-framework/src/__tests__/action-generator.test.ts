import { describe, it, expect } from "vitest"
import { GameEngine } from "@tcg/game-engine"
import { ActionType, Phase } from "@tcg/shared-types"
import { generateValidActions } from "../bots/action-generator"
import { P1, P2, BASIC_DECK, ACE_CARD, SEED, createTestState } from "./helpers"

describe("generateValidActions", () => {
  it("returns only END_MAIN_PHASE when player has no resources", () => {
    const state = new GameEngine(createTestState()).getState()
    const actions = generateValidActions(state, P1)
    // At turn start: 0 resources, hand has cards → only infuse + end
    const types = new Set(actions.map((a) => a.type))
    expect(types.has(ActionType.INFUSE_CARD)).toBe(true)
    expect(types.has(ActionType.END_MAIN_PHASE)).toBe(true)
    expect(types.has(ActionType.SUMMON_UNIT)).toBe(false)
  })

  it("generates summon actions when player has resources and empty lanes", () => {
    const state = createTestState()
    const engine = new GameEngine(state)
    // Infuse 2 cards to get 4 resources (iron_sentinel infuseValue=2 each)
    const s1 = engine.getState()
    const hand = s1.players[P1]!.hand
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[1]!.instanceId })

    const state2 = engine.getState()
    expect(state2.players[P1]!.temporaryResources).toBe(4)

    const actions = generateValidActions(state2, P1)
    const summons = actions.filter((a) => a.type === ActionType.SUMMON_UNIT)
    // 3 remaining hand cards × 5 lanes = 15 summon options (cost 3 ≤ 4 resources)
    expect(summons.length).toBe(15)
  })

  it("returns empty when it is not the player's turn", () => {
    const state = createTestState()
    const actions = generateValidActions(state, P2)
    expect(actions).toHaveLength(0)
  })

  it("generates END_TURN_SELECT action in END_TURN_SELECT phase", () => {
    const state = createTestState()
    const engine = new GameEngine(state)
    // Give P1 resources and fill hand to > 2, then end phase
    const s = engine.getState()
    const hand = s.players[P1]!.hand

    // Infuse to get resources, end main phase to trigger draw + potential END_TURN_SELECT
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.END_MAIN_PHASE, playerId: P1 })

    const state2 = engine.getState()
    if (state2.phase === Phase.END_TURN_SELECT) {
      const actions = generateValidActions(state2, P1)
      expect(actions).toHaveLength(1)
      expect(actions[0]!.type).toBe(ActionType.END_TURN_SELECT)
      if (actions[0]!.type === ActionType.END_TURN_SELECT) {
        expect(actions[0]!.keepInstanceIds.length).toBeLessThanOrEqual(2)
      }
    }
  })

  it("ace card generates summon actions after revolve", () => {
    const state = createTestState()
    // revolveCount = 0, ace should NOT appear in summon actions even with resources
    const engine = new GameEngine(state)
    const s = engine.getState()
    const hand = s.players[P1]!.hand
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[0]!.instanceId })
    engine.dispatch({ type: ActionType.INFUSE_CARD, playerId: P1, cardInstanceId: hand[1]!.instanceId })

    const state2 = engine.getState()
    expect(state2.players[P1]!.revolveCount).toBe(0)
    const actions = generateValidActions(state2, P1)
    const summons = actions.filter((a) => a.type === ActionType.SUMMON_UNIT)
    // Only hand cards, not ace
    const handCards = state2.players[P1]!.hand
    const aceId = state2.players[P1]!.ace?.instanceId
    const usesAce = summons.some(
      (a) => a.type === ActionType.SUMMON_UNIT && a.cardInstanceId === aceId
    )
    expect(usesAce).toBe(false)
    expect(summons.length).toBe(handCards.length * 5)
  })
})
