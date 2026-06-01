"use client"

import {
  CardClass,
  CardType,
  EffectConditionType,
  EffectType,
  Keyword,
  PrimedConditionType,
  Rarity,
  SpellType,
  TargetType,
  TriggerType,
} from "@tcg/shared-types"

export interface DraftAction {
  type: EffectType
  target: TargetType
  value: number
  cardId: string
}

export interface DraftCondition {
  type: EffectConditionType
  value: number
}

export interface DraftTriggeredAbility {
  kind: "triggered"
  trigger: TriggerType
  conditions: DraftCondition[]
  actions: DraftAction[]
}

export interface DraftActivatedAbility {
  kind: "activated"
  displayName: string
  activationCost: number
  oncePerTurn: boolean
  oncePerGame: boolean
  conditions: DraftCondition[]
  actions: DraftAction[]
}

export type DraftAbility = DraftTriggeredAbility | DraftActivatedAbility

export interface CardDraft {
  id: string
  type: CardType
  cost: number
  infuse: number
  // Unit fields
  attack: number
  health: number
  keywords: Keyword[]
  hasPrimed: boolean
  primedConditionType: PrimedConditionType
  primedConditionValue: number
  primedStatAttack: number | ""
  primedStatHealth: number | ""
  primedKeywords: Keyword[]
  hasAura: boolean
  auraAttack: number | ""
  auraPerRevolve: boolean
  // Spell fields
  spellType: SpellType
  // Shared
  abilities: DraftAbility[]
  rarity: Rarity
  cardClass: CardClass
  isLegendary: boolean
  // Locale
  name: string
  text: string
  flavorText: string
}

export const DEFAULT_DRAFT: CardDraft = {
  id: "",
  type: CardType.Unit,
  cost: 2,
  infuse: 1,
  attack: 2,
  health: 2,
  keywords: [],
  hasPrimed: false,
  primedConditionType: PrimedConditionType.REVOLVED_X_TIMES,
  primedConditionValue: 1,
  primedStatAttack: "",
  primedStatHealth: "",
  primedKeywords: [],
  hasAura: false,
  auraAttack: "",
  auraPerRevolve: false,
  spellType: SpellType.Normal,
  abilities: [],
  rarity: Rarity.Common,
  cardClass: CardClass.Warrior,
  isLegendary: false,
  name: "",
  text: "",
  flavorText: "",
}

export const DEFAULT_ACTION: DraftAction = {
  type: EffectType.DEAL_DAMAGE,
  target: TargetType.ENEMY_UNIT,
  value: 1,
  cardId: "",
}

export const DEFAULT_TRIGGERED: DraftTriggeredAbility = {
  kind: "triggered",
  trigger: TriggerType.ON_SUMMON,
  conditions: [],
  actions: [{ type: EffectType.REVOLVE_DECK_TOP, target: TargetType.SELF, value: 1, cardId: "" }],
}

export const DEFAULT_ACTIVATED: DraftActivatedAbility = {
  kind: "activated",
  displayName: "",
  activationCost: 2,
  oncePerTurn: true,
  oncePerGame: false,
  conditions: [],
  actions: [{ type: EffectType.BUFF_HEALTH, target: TargetType.SELF, value: 1, cardId: "" }],
}

export const DEFAULT_CONDITION: DraftCondition = {
  type: EffectConditionType.CONTROLS_X_UNITS,
  value: 5,
}

// Which effect types need which fields
export const EFFECT_NEEDS_TARGET = new Set([
  EffectType.DEAL_DAMAGE,
  EffectType.HEAL,
  EffectType.BUFF_ATTACK,
  EffectType.BUFF_HEALTH,
  EffectType.DESTROY_UNIT,
  EffectType.SILENCE,
  EffectType.SUMMON_TOKEN,
  EffectType.GRANT_ABILITY,
])

export const EFFECT_NEEDS_VALUE = new Set([
  EffectType.DEAL_DAMAGE,
  EffectType.HEAL,
  EffectType.BUFF_ATTACK,
  EffectType.BUFF_HEALTH,
  EffectType.REVOLVE_DECK_TOP,
  EffectType.REVOLVE_TO_DECK,
])

export const EFFECT_NEEDS_CARD_ID = new Set([EffectType.ADD_CARD_TO_HAND])
