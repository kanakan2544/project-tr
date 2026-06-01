import type { BotPlayer } from "../bots/bot-interface"
import { runSimulation } from "./simulation-runner"

export interface StressTestConfig {
  player1Id: string
  player2Id: string
  player1Bot: BotPlayer
  player2Bot: BotPlayer
  player1DeckIds: string[]
  player2DeckIds: string[]
  player1AceId: string
  player2AceId: string
  games: number
  baseSeed?: number
  maxTurns?: number
}

export interface StressTestResult {
  totalGames: number
  player1Wins: number
  player2Wins: number
  draws: number
  timeouts: number
  avgTurns: number
  minTurns: number
  maxTurns: number
}

export function runStressTest(config: StressTestConfig): StressTestResult {
  const baseSeed = config.baseSeed ?? 0

  let player1Wins = 0
  let player2Wins = 0
  let draws = 0
  let timeouts = 0
  let totalTurns = 0
  let minTurns = Infinity
  let maxTurnsObserved = 0

  for (let i = 0; i < config.games; i++) {
    const simConfig = {
      matchId: `stress-${i}`,
      player1Id: config.player1Id,
      player2Id: config.player2Id,
      player1Bot: config.player1Bot,
      player2Bot: config.player2Bot,
      player1DeckIds: config.player1DeckIds,
      player2DeckIds: config.player2DeckIds,
      player1AceId: config.player1AceId,
      player2AceId: config.player2AceId,
      seed: baseSeed + i,
      ...(config.maxTurns !== undefined ? { maxTurns: config.maxTurns } : {}),
    }
    const result = runSimulation(simConfig)

    totalTurns += result.turns
    if (result.turns < minTurns) minTurns = result.turns
    if (result.turns > maxTurnsObserved) maxTurnsObserved = result.turns

    if (result.timedOut) {
      timeouts++
    } else if (result.isDraw) {
      draws++
    } else if (result.winner === config.player1Id) {
      player1Wins++
    } else if (result.winner === config.player2Id) {
      player2Wins++
    }
  }

  return {
    totalGames: config.games,
    player1Wins,
    player2Wins,
    draws,
    timeouts,
    avgTurns: config.games > 0 ? totalTurns / config.games : 0,
    minTurns: minTurns === Infinity ? 0 : minTurns,
    maxTurns: maxTurnsObserved,
  }
}
