import type { GameState, GameAction, GameEvent } from "@tcg/shared-types"
import { ActionType } from "@tcg/shared-types"
import { executeInfuse } from "../systems/infuse-system"
import { executeSummon } from "../systems/summon-system"
import { executeCastSpell } from "../systems/spell-system"
import { executeEndTurnSelect } from "../systems/end-turn-system"
import { processEndMainPhase } from "../phases/phase-manager"
import { executeActivateAbility } from "../systems/activated-ability-system"

export function executeAction(
  state: GameState,
  action: GameAction
): { nextState: GameState; events: GameEvent[] } {
  switch (action.type) {
    case ActionType.SUMMON_UNIT:
      return executeSummon(state, action)
    case ActionType.CAST_SPELL:
      return executeCastSpell(state, action)
    case ActionType.INFUSE_CARD:
      return executeInfuse(state, action)
    case ActionType.ACTIVATE_ABILITY:
      return executeActivateAbility(state, action)
    case ActionType.END_MAIN_PHASE:
      return processEndMainPhase(state)
    case ActionType.END_TURN_SELECT:
      return executeEndTurnSelect(state, action)
  }
}
