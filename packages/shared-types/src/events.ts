import { EffectType, Phase, TriggerType } from "./enums"
import { PlayerId } from "./state"

export type GameEvent =
  | { readonly type: "UNIT_SUMMONED"; readonly instanceId: string; readonly lane: number; readonly owner: PlayerId }
  | { readonly type: "UNIT_DAMAGED"; readonly instanceId: string; readonly damage: number; readonly remainingHealth: number; readonly attackerInstanceId?: string }
  | { readonly type: "UNIT_DESTROYED"; readonly instanceId: string; readonly lane: number; readonly owner: PlayerId }
  | { readonly type: "PLAYER_DAMAGED"; readonly playerId: PlayerId; readonly damage: number; readonly remainingLife: number; readonly attackerInstanceId?: string }
  | { readonly type: "PLAYER_HEALED"; readonly playerId: PlayerId; readonly amount: number; readonly newLife: number }
  | { readonly type: "CARD_INFUSED"; readonly instanceId: string; readonly resourcesGenerated: number }
  | { readonly type: "REVOLVE_TRIGGERED"; readonly playerId: PlayerId; readonly revolveCount: number }
  | { readonly type: "ACE_UNLOCKED"; readonly playerId: PlayerId }
  | { readonly type: "FATIGUE_DAMAGE"; readonly playerId: PlayerId; readonly damage: number }
  | { readonly type: "PHASE_CHANGED"; readonly from: Phase; readonly to: Phase }
  | { readonly type: "TURN_STARTED"; readonly turn: number; readonly activePlayer: PlayerId }
  | { readonly type: "TURN_ENDED"; readonly turn: number }
  | { readonly type: "CARDS_DRAWN"; readonly playerId: PlayerId; readonly count: number }
  | { readonly type: "UNIT_PRIMED"; readonly instanceId: string }
  | { readonly type: "SPELLSHIELD_NEGATED"; readonly instanceId: string }
  | { readonly type: "END_TURN_SELECT_REQUIRED"; readonly playerId: PlayerId; readonly handSize: number }
  | { readonly type: "GAME_OVER"; readonly winner: PlayerId | null; readonly isDraw: boolean }
  | { readonly type: "EFFECT_TRIGGERED"; readonly trigger: TriggerType; readonly sourceInstanceId: string; readonly effectType: EffectType }
  | { readonly type: "UNIT_BUFFED"; readonly instanceId: string; readonly attackDelta: number; readonly healthDelta: number }
  | { readonly type: "ABILITY_ACTIVATED"; readonly unitInstanceId: string; readonly abilityIndex: number }
  | { readonly type: "BARRIER_BROKEN"; readonly instanceId: string }
  | { readonly type: "DECK_CARDS_REVOLVED"; readonly playerId: PlayerId; readonly count: number }
  | { readonly type: "CARD_ADDED_TO_HAND"; readonly playerId: PlayerId; readonly cardId: string }
  | { readonly type: "UNIT_RETURNED_TO_REVOLVE"; readonly instanceId: string }
  | { readonly type: "REVOLVE_CARD_DISCARDED"; readonly playerId: PlayerId; readonly cardId: string }
  | { readonly type: "REVOLVE_CARDS_TO_DECK"; readonly playerId: PlayerId; readonly count: number }
  | { readonly type: "ABILITY_GRANTED"; readonly unitInstanceId: string }
