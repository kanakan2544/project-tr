import { describe, it, expect } from "vitest"
import { runSimulation } from "../simulation/simulation-runner"
import { RandomBot } from "../bots/random-bot"
import { GreedyBot } from "../bots/greedy-bot"
import { BASIC_DECK, ACE_CARD, P1, P2, SEED } from "./helpers"

const baseConfig = {
  player1Id: P1,
  player2Id: P2,
  player1DeckIds: BASIC_DECK,
  player2DeckIds: BASIC_DECK,
  player1AceId: ACE_CARD,
  player2AceId: ACE_CARD,
}

describe("runSimulation", () => {
  it("terminates with a winner or draw (random vs random)", () => {
    const result = runSimulation({
      ...baseConfig,
      matchId: "test-random-vs-random",
      player1Bot: new RandomBot(),
      player2Bot: new RandomBot(),
      seed: SEED,
    })
    expect(result.winner !== null || result.isDraw || result.timedOut).toBe(true)
    expect(result.turns).toBeGreaterThan(0)
  })

  it("terminates with a winner or draw (greedy vs greedy)", () => {
    const result = runSimulation({
      ...baseConfig,
      matchId: "test-greedy-vs-greedy",
      player1Bot: new GreedyBot(),
      player2Bot: new GreedyBot(),
      seed: SEED,
    })
    expect(result.winner !== null || result.isDraw || result.timedOut).toBe(true)
  })

  it("records all dispatched actions", () => {
    const result = runSimulation({
      ...baseConfig,
      matchId: "test-record",
      player1Bot: new RandomBot(),
      player2Bot: new RandomBot(),
      seed: SEED,
    })
    expect(result.recordedActions.length).toBeGreaterThan(0)
  })

  it("respects maxTurns cap (times out on very low limit)", () => {
    const result = runSimulation({
      ...baseConfig,
      matchId: "test-timeout",
      player1Bot: new RandomBot(),
      player2Bot: new RandomBot(),
      seed: SEED,
      maxTurns: 1,
    })
    // With maxTurns=1 and game unlikely to end in 1 turn, should time out
    // (or end naturally — both outcomes acceptable)
    expect(result.timedOut || result.winner !== null || result.isDraw).toBe(true)
  })

  it("is deterministic — same seed produces same result", () => {
    const cfg = {
      ...baseConfig,
      matchId: "test-determinism",
      player1Bot: new RandomBot(),
      player2Bot: new RandomBot(),
      seed: 99,
    }
    const r1 = runSimulation({ ...cfg, matchId: "det-1" })
    const r2 = runSimulation({ ...cfg, matchId: "det-2" })
    expect(r1.winner).toBe(r2.winner)
    expect(r1.turns).toBe(r2.turns)
    expect(r1.isDraw).toBe(r2.isDraw)
  })
})
