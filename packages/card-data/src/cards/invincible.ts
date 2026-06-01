import {
  CardClass, CardType, EffectConditionType, EffectType,
  Keyword, PrimedConditionType, Rarity, SpellType, TargetType, TriggerType,
} from "@tcg/shared-types"
import type { CardDefinition } from "@tcg/shared-types"

export const invincibleCards: CardDefinition[] = [
  // ── Units ─────────────────────────────────────────────────────────────────

  {
    id: "donald_ferguson",
    type: CardType.Unit,
    cost: 1,
    infuse: 1,
    attack: 1,
    health: 2,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_SUMMON,
        actions: [{ type: EffectType.REVOLVE_DECK_TOP, value: 1 }],
      },
    ],
    metadata: { rarity: Rarity.Common, class: CardClass.Invincible },
  },

  {
    id: "reanimen",
    type: CardType.Unit,
    cost: 1,
    infuse: 1,
    attack: 2,
    health: 1,
    keywords: [Keyword.Charge],
    metadata: { rarity: Rarity.Common, class: CardClass.Invincible },
  },

  {
    id: "dupli_cate",
    type: CardType.Unit,
    cost: 2,
    infuse: 1,
    attack: 2,
    health: 2,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_SUMMON,
        actions: [{ type: EffectType.ADD_CARD_TO_HAND, cardId: "dupli_cate" }],
      },
    ],
    metadata: { rarity: Rarity.Common, class: CardClass.Invincible },
  },

  {
    id: "atom_eve",
    type: CardType.Unit,
    cost: 2,
    infuse: 3,
    attack: 1,
    health: 4,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_SUMMON,
        actions: [{ type: EffectType.REVOLVE_DECK_TOP, value: 1 }],
      },
    ],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Invincible },
  },

  {
    id: "robot",
    type: CardType.Unit,
    cost: 3,
    infuse: 3,
    attack: 2,
    health: 4,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_SUMMON,
        actions: [{ type: EffectType.REVOLVE_DECK_TOP, value: 2 }],
      },
    ],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Invincible },
  },

  {
    // Cecil Stedman — Aura: adjacent allies +3 attack per revolveCount
    id: "cecil_stedman",
    type: CardType.Unit,
    cost: 3,
    infuse: 2,
    attack: 0,
    health: 3,
    keywords: [],
    aura: { scope: "ADJACENT_ALLIES", attack: 3, perRevolve: true },
    metadata: { rarity: Rarity.Legendary, class: CardClass.Invincible, isLegendary: true },
  },

  {
    id: "rex_splode",
    type: CardType.Unit,
    cost: 3,
    infuse: 3,
    attack: 4,
    health: 3,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_ATTACK,
        actions: [{ type: EffectType.REVOLVE_DECK_TOP, value: 1 }],
      },
    ],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Invincible },
  },

  {
    id: "monster_girl",
    type: CardType.Unit,
    cost: 4,
    infuse: 1,
    attack: 4,
    health: 5,
    keywords: [],
    metadata: { rarity: Rarity.Common, class: CardClass.Invincible },
  },

  {
    // Oliver Grayson — gains Evasion after first revolve
    id: "oliver_grayson",
    type: CardType.Unit,
    cost: 4,
    infuse: 1,
    attack: 5,
    health: 3,
    keywords: [],
    primedCondition: { type: PrimedConditionType.REVOLVED_X_TIMES, value: 1 },
    primedKeywords: [Keyword.Evasion],
    metadata: { rarity: Rarity.Rare, class: CardClass.Invincible },
  },

  {
    id: "tech_jacket",
    type: CardType.Unit,
    cost: 4,
    infuse: 2,
    attack: 4,
    health: 4,
    keywords: [Keyword.QuickAttack],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Invincible },
  },

  {
    // Allen the Alien — activated 1/turn cost 2: +0/+1
    id: "allen_the_alien",
    type: CardType.Unit,
    cost: 5,
    infuse: 2,
    attack: 5,
    health: 5,
    keywords: [],
    abilities: [
      {
        kind: "activated",
        displayName: "Resilience",
        activationCost: 2,
        oncePerTurn: true,
        actions: [{ type: EffectType.BUFF_HEALTH, target: TargetType.SELF, value: 1 }],
      },
    ],
    metadata: { rarity: Rarity.Rare, class: CardClass.Invincible },
  },

  {
    // Invincible — gains +1/+1 and QuickAttack after first revolve
    id: "invincible",
    type: CardType.Unit,
    cost: 5,
    infuse: 1,
    attack: 5,
    health: 5,
    keywords: [],
    primedCondition: { type: PrimedConditionType.REVOLVED_X_TIMES, value: 1 },
    primedStats: { attack: 1, health: 1 },
    primedKeywords: [Keyword.QuickAttack],
    metadata: { rarity: Rarity.Legendary, class: CardClass.Invincible, isLegendary: true },
  },

  {
    // Immortal — ON_DESTROY: move self back to revolve pile
    id: "immortal",
    type: CardType.Unit,
    cost: 6,
    infuse: 2,
    attack: 5,
    health: 7,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_DESTROY,
        actions: [{ type: EffectType.RETURN_SELF_TO_REVOLVE }],
      },
    ],
    metadata: { rarity: Rarity.Rare, class: CardClass.Invincible },
  },

  {
    // Omni-Man — gains +2/+2 and Piercing after first revolve
    id: "omni_man",
    type: CardType.Unit,
    cost: 7,
    infuse: 1,
    attack: 6,
    health: 7,
    keywords: [],
    primedCondition: { type: PrimedConditionType.REVOLVED_X_TIMES, value: 1 },
    primedStats: { attack: 2, health: 2 },
    primedKeywords: [Keyword.Piercing],
    metadata: { rarity: Rarity.Legendary, class: CardClass.Invincible, isLegendary: true },
  },

  // ── Spells ────────────────────────────────────────────────────────────────

  {
    // Send to the Jail — opponent's lowest-cost revolve card → discard
    id: "send_to_the_jail",
    type: CardType.Spell,
    cost: 2,
    infuse: 0,
    spellType: SpellType.Normal,
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_PLAY,
        actions: [{ type: EffectType.SEND_REVOLVE_TO_DISCARD }],
      },
    ],
    metadata: { rarity: Rarity.Common, class: CardClass.Invincible },
  },

  {
    // Team Up — if you control 5 units, all your units +3/+3
    id: "team_up",
    type: CardType.Spell,
    cost: 4,
    infuse: 2,
    spellType: SpellType.Normal,
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_PLAY,
        conditions: [{ type: EffectConditionType.CONTROLS_X_UNITS, value: 5 }],
        actions: [
          { type: EffectType.BUFF_ATTACK, target: TargetType.ALL_ALLY_UNITS, value: 3 },
          { type: EffectType.BUFF_HEALTH, target: TargetType.ALL_ALLY_UNITS, value: 3 },
        ],
      },
    ],
    metadata: { rarity: Rarity.Rare, class: CardClass.Invincible },
  },

  {
    // Cross the Line — ally +3/+0, grant ON_KILL: 3 revolve cards → deck
    id: "cross_the_line",
    type: CardType.Spell,
    cost: 3,
    infuse: 0,
    spellType: SpellType.Normal,
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_PLAY,
        actions: [
          { type: EffectType.BUFF_ATTACK, target: TargetType.ALLY_UNIT, value: 3 },
          {
            type: EffectType.GRANT_ABILITY,
            target: TargetType.ALLY_UNIT,
            ability: {
              kind: "triggered",
              trigger: TriggerType.ON_KILL,
              actions: [{ type: EffectType.REVOLVE_TO_DECK, value: 3 }],
            },
          },
        ],
      },
    ],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Invincible },
  },
]
