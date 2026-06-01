import type { GameAction, ActionResult, GameState } from "@tcg/shared-types"
import { Phase } from "@tcg/shared-types"
import { validateAction } from "../validators/action-validator"
import { executeAction } from "./action-executor"
import { deepCloneState } from "../utils/state-helpers"
import { processStartTurn } from "../phases/phase-manager"
import { recomputeAuras } from "../systems/aura-system"

export class GameEngine {
  private state: GameState

  constructor(initialState: GameState) {
    this.state = deepCloneState(initialState)
    // Auto-advance START_TURN phase on init
    if (this.state.phase === Phase.START_TURN) {
      const result = processStartTurn(this.state)
      this.state = result.nextState
    }
    this.state = recomputeAuras(this.state)
  }

  dispatch(action: GameAction): ActionResult {
    const validationError = validateAction(this.state, action)
    if (validationError) {
      return { success: false, error: validationError }
    }

    const { nextState, events } = executeAction(this.state, action)
    this.state = recomputeAuras(nextState)

    return {
      success: true,
      state: deepCloneState(this.state),
      events,
    }
  }

  getState(): GameState {
    return deepCloneState(this.state)
  }

  loadState(state: GameState): void {
    this.state = deepCloneState(state)
  }
}
