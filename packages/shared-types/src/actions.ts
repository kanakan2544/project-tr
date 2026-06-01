import { ActionType } from "./enums"
import { PlayerId, GameState } from "./state"
import { GameEvent } from "./events"

export interface SummonUnitAction {
  readonly type: ActionType.SUMMON_UNIT
  readonly playerId: PlayerId
  readonly cardInstanceId: string
  readonly targetLane: number
}

export interface CastSpellAction {
  readonly type: ActionType.CAST_SPELL
  readonly playerId: PlayerId
  readonly cardInstanceId: string
  readonly targetInstanceId?: string
  readonly targetPlayerId?: PlayerId
}

export interface InfuseCardAction {
  readonly type: ActionType.INFUSE_CARD
  readonly playerId: PlayerId
  readonly cardInstanceId: string
}

export interface ActivateAbilityAction {
  readonly type: ActionType.ACTIVATE_ABILITY
  readonly playerId: PlayerId
  readonly unitInstanceId: string
  readonly abilityIndex: number
  readonly targetInstanceId?: string
  readonly targetPlayerId?: PlayerId
}

export interface EndMainPhaseAction {
  readonly type: ActionType.END_MAIN_PHASE
  readonly playerId: PlayerId
}

export interface EndTurnSelectAction {
  readonly type: ActionType.END_TURN_SELECT
  readonly playerId: PlayerId
  readonly keepInstanceIds: string[]
}

export type GameAction =
  | SummonUnitAction
  | CastSpellAction
  | InfuseCardAction
  | ActivateAbilityAction
  | EndMainPhaseAction
  | EndTurnSelectAction

export interface ActionResult {
  readonly success: boolean
  readonly error?: string
  readonly state?: GameState
  readonly events?: GameEvent[]
}
