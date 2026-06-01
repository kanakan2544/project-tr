import { Keyword, Phase, TriggerType } from "./enums"
import { AbilityAction, TriggeredAbility } from "./card"

export type PlayerId = string

export interface UnitInstance {
  readonly instanceId: string
  readonly cardId: string
  readonly owner: PlayerId
  attack: number
  maxHealth: number
  currentHealth: number
  lane: number
  status: {
    standBy: boolean
    exhausted: boolean
    silenced: boolean
    spellshieldActive: boolean
    barrierActive: boolean
  }
  keywords: Keyword[]
  flags: Record<string, unknown>
  primedInfuseCount: number
  isPrimed: boolean
  abilitiesUsedThisTurn: number[]
  abilitiesUsedThisGame: number[]
  grantedAbilities: TriggeredAbility[]
}

export interface CardInstance {
  readonly instanceId: string
  readonly cardId: string
  readonly owner: PlayerId
  primedInfuseCount: number
  infuseValueBonus: number
}

export interface LaneState {
  readonly index: number
  unit: UnitInstance | null
}

export interface PlayerState {
  readonly id: PlayerId
  life: number
  deck: CardInstance[]
  hand: CardInstance[]
  revolvePile: CardInstance[]
  discardPile: CardInstance[]
  battlefield: LaneState[]
  ace: CardInstance | null
  revolveCount: number
  temporaryResources: number
}

export interface EffectQueueItem {
  readonly id: string
  readonly source: string
  readonly sourceOwner: PlayerId
  readonly trigger: TriggerType
  readonly action: AbilityAction
  readonly targetInstanceId?: string
  readonly targetPlayerId?: PlayerId
}

export interface ActionLogEntry {
  readonly turn: number
  readonly phase: Phase
  readonly playerId: PlayerId
  readonly actionType: string
  readonly timestamp: number
}

export interface GameState {
  readonly matchId: string
  turn: number
  activePlayer: PlayerId
  phase: Phase
  players: Record<PlayerId, PlayerState>
  effectQueue: EffectQueueItem[]
  winner: PlayerId | null
  isDraw: boolean
  actionLog: ActionLogEntry[]
  shuffleSeed: number
}
