import { describe, it, expect } from "vitest"
import { runStressTest } from "../simulation/stress-tester"
import { RandomBot } from "../bots/random-bot"
import { GreedyBot } from "../bots/greedy-bot"
import { BASIC_DECK, ACE_CARD, P1, P2 } from "./helpers"

const baseConfig = {
  player1Id: P1,
  player2Id: P2,
  player1DeckIds: BASIC_DECK,
  player2DeckIds: BASIC_DECK,
  player1AceId: ACE_CARD,
  player2AceId: ACE_CARD,
}

describe("runStressTest", () => {
  it("runs exactly the requested number of games", () => {
    const result = runStressTest({
      ...baseConfig,
      player1Bot: new RandomBot(),
      player2Bot: new RandomBot(),
      games: 10,
    })
    expect(result.totalGames).toBe(10)
    expect(result.player1Wins + result.player2Wins + result.draws + result.timeouts).toBe(10)
  })

  it("neither player wins 100% of games across 50 games", () => {
    const result = runStressTest({
      ...baseConfig,
      player1Bot: new RandomBot(),
      player2Bot: new RandomBot(),
      games: 50,
      baseSeed: 0,
    })
    // With 50 games neither player should win all of them
    expect(result.player1Wins).toBeLessThan(50)
    expect(result.player2Wins).toBeLessThan(50)
  })

  it("avgTurns is within a sane range (5–200)", () => {
    const result = runStressTest({
      ...baseConfig,
      player1Bot: new GreedyBot(),
      player2Bot: new GreedyBot(),
      games: 10,
      baseSeed: 500,
    })
    expect(result.avgTurns).toBeGreaterThan(5)
    expect(result.avgTurns).toBeLessThanOrEqual(200)
  })

  it("minTurns ≤ avgTurns ≤ maxTurns", () => {
    const result = runStressTest({
      ...baseConfig,
      player1Bot: new RandomBot(),
      player2Bot: new GreedyBot(),
      games: 10,
      baseSeed: 200,
    })
    expect(result.minTurns).toBeLessThanOrEqual(result.avgTurns)
    expect(result.avgTurns).toBeLessThanOrEqual(result.maxTurns)
  })
})
