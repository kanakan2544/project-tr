import type { GameAction } from "@tcg/shared-types"
import { ActionType } from "@tcg/shared-types"
import { GameEngine, createInitialGameState } from "@tcg/game-engine"
import type { BotPlayer } from "../bots/bot-interface"

export interface SimulationConfig {
  matchId: string
  player1Id: string
  player2Id: string
  player1Bot: BotPlayer
  player2Bot: BotPlayer
  player1DeckIds: string[]
  player2DeckIds: string[]
  player1AceId: string
  player2AceId: string
  seed: number
  maxTurns?: number
}

export interface SimulationResult {
  matchId: string
  winner: string | null
  isDraw: boolean
  turns: number
  timedOut: boolean
  recordedActions: GameAction[]
}

const DEFAULT_MAX_TURNS = 200

export function runSimulation(config: SimulationConfig): SimulationResult {
  const maxTurns = config.maxTurns ?? DEFAULT_MAX_TURNS
  const recordedActions: GameAction[] = []

  const initialState = createInitialGameState(
    config.matchId,
    config.player1Id,
    config.player2Id,
    config.player1DeckIds,
    config.player2DeckIds,
    config.player1AceId,
    config.player2AceId,
    config.seed
  )

  const engine = new GameEngine(initialState)

  while (true) {
    const state = engine.getState()

    if (state.winner !== null || state.isDraw) {
      return {
        matchId: config.matchId,
        winner: state.winner,
        isDraw: state.isDraw,
        turns: state.turn,
        timedOut: false,
        recordedActions,
      }
    }

    if (state.turn > maxTurns) {
      return {
        matchId: config.matchId,
        winner: null,
        isDraw: false,
        turns: state.turn,
        timedOut: true,
        recordedActions,
      }
    }

    const bot =
      state.activePlayer === config.player1Id ? config.player1Bot : config.player2Bot

    const action = bot.selectAction(state, state.activePlayer)
    const result = engine.dispatch(action)

    if (!result.success) {
      // Bot produced an invalid action — fall back to ending the turn
      const fallback: GameAction = { type: ActionType.END_MAIN_PHASE, playerId: state.activePlayer }
      engine.dispatch(fallback)
      recordedActions.push(fallback)
    } else {
      recordedActions.push(action)
    }
  }
}
