import {
  CardClass, CardType, EffectConditionType, Keyword, PrimedConditionType,
  Rarity, SpellType, TriggerType, EffectType, TargetType
} from "./enums"

// --- Action (discriminated union — each variant carries exactly the fields it needs) ---
export type AbilityAction =
  | { readonly type: EffectType.DEAL_DAMAGE;  readonly target: TargetType; readonly value: number }
  | { readonly type: EffectType.HEAL;          readonly target: TargetType; readonly value: number }
  | { readonly type: EffectType.BUFF_ATTACK;  readonly target: TargetType; readonly value: number }
  | { readonly type: EffectType.BUFF_HEALTH;  readonly target: TargetType; readonly value: number }
  | { readonly type: EffectType.DESTROY_UNIT; readonly target: TargetType }
  | { readonly type: EffectType.SILENCE;       readonly target: TargetType }
  | { readonly type: EffectType.DRAW_CARD }
  | { readonly type: EffectType.SUMMON_TOKEN; readonly target: TargetType; readonly value?: number }
  | { readonly type: EffectType.REVOLVE_DECK_TOP; readonly value: number }
  | { readonly type: EffectType.ADD_CARD_TO_HAND; readonly cardId: string }
  | { readonly type: EffectType.RETURN_SELF_TO_REVOLVE }
  | { readonly type: EffectType.SEND_REVOLVE_TO_DISCARD }
  | { readonly type: EffectType.REVOLVE_TO_DECK; readonly value: number }
  | { readonly type: EffectType.GRANT_ABILITY; readonly target: TargetType; readonly ability: TriggeredAbility }

// --- Condition ---
export type AbilityCondition =
  | { readonly type: EffectConditionType.SELF_IS_PRIMED }
  | { readonly type: EffectConditionType.CONTROLS_X_UNITS; readonly value: number }

// --- Unified ability (discriminated by kind) ---
export interface TriggeredAbility {
  readonly kind: "triggered"
  readonly trigger: TriggerType
  readonly conditions?: readonly AbilityCondition[]
  readonly actions: readonly AbilityAction[]
}

export interface ActivatedAbility {
  readonly kind: "activated"
  readonly activationCost: number
  readonly oncePerTurn: boolean
  readonly oncePerGame?: boolean
  readonly conditions?: readonly AbilityCondition[]
  readonly actions: readonly AbilityAction[]
  readonly displayName?: string
}

export type Ability = TriggeredAbility | ActivatedAbility

// --- Primed condition (kept as top-level — atomic stat swap) ---
export interface PrimedCondition {
  readonly type: PrimedConditionType
  readonly value: number
}

// --- Non-gameplay identity metadata ---
export interface CardMetadata {
  readonly rarity: Rarity
  readonly class: CardClass
  readonly isLegendary?: boolean
}

// --- Presentation (future: art, sfx, vfx, voice, animation) ---
export interface PresentationRef {
  readonly artId?: string
}

export interface PresentationData {
  readonly artId?: string
  readonly sfx?: { readonly summon?: string; readonly attack?: string; readonly death?: string }
  readonly vfx?: { readonly summon?: string; readonly attack?: string }
  readonly voice?: { readonly summon?: string }
  readonly animation?: { readonly summon?: string; readonly idle?: string }
}

// --- Localization ---
export interface CardLocaleEntry {
  readonly name: string
  readonly text?: string
  readonly flavorText?: string
}
export type CardLocale = Record<string, CardLocaleEntry>

// --- CardDefinition (pure gameplay data — no text strings) ---
interface BaseCardDefinition {
  readonly id: string
  readonly type: CardType
  readonly cost: number
  readonly infuse: number
  readonly abilities?: readonly Ability[]
  readonly metadata: CardMetadata
  readonly presentation?: PresentationRef
}

export interface UnitAura {
  readonly scope: "ADJACENT_ALLIES"
  readonly attack?: number
  readonly perRevolve?: boolean
}

export interface UnitCardDefinition extends BaseCardDefinition {
  readonly type: CardType.Unit
  readonly attack: number
  readonly health: number
  readonly keywords?: readonly Keyword[]
  readonly primedCondition?: PrimedCondition
  readonly primedStats?: { readonly attack?: number; readonly health?: number }
  readonly primedKeywords?: readonly Keyword[]
  readonly aura?: UnitAura
}

export interface SpellCardDefinition extends BaseCardDefinition {
  readonly type: CardType.Spell
  readonly spellType: SpellType
}

export type CardDefinition = UnitCardDefinition | SpellCardDefinition

// --- Backwards-compat aliases (remove after Phase 9) ---
export type CardData = CardDefinition
export type UnitCardData = UnitCardDefinition
export type SpellCardData = SpellCardDefinition
