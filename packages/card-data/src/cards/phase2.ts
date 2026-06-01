import {
  CardClass, CardType, EffectConditionType, EffectType,
  PrimedConditionType, Rarity, TargetType, TriggerType,
} from "@tcg/shared-types"
import type { UnitCardDefinition } from "@tcg/shared-types"

export const phase2Cards: UnitCardDefinition[] = [
  {
    id: "ember_seer",
    type: CardType.Unit,
    cost: 4,
    infuse: 2,
    attack: 2,
    health: 3,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_SUMMON,
        actions: [{ type: EffectType.DEAL_DAMAGE, target: TargetType.ENEMY_PLAYER, value: 2 }],
      },
    ],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Scholar },
  },
  {
    id: "grave_sentinel",
    type: CardType.Unit,
    cost: 3,
    infuse: 2,
    attack: 2,
    health: 4,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_DESTROY,
        actions: [{ type: EffectType.DRAW_CARD }],
      },
    ],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Abyss },
  },
  {
    id: "storm_channeler",
    type: CardType.Unit,
    cost: 5,
    infuse: 3,
    attack: 3,
    health: 4,
    keywords: [],
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_ATTACK,
        actions: [{ type: EffectType.BUFF_ATTACK, target: TargetType.SELF, value: 1 }],
      },
      {
        kind: "activated",
        displayName: "Channel Storm",
        activationCost: 2,
        oncePerTurn: true,
        actions: [{ type: EffectType.DEAL_DAMAGE, target: TargetType.ENEMY_PLAYER, value: 2 }],
      },
    ],
    metadata: { rarity: Rarity.Rare, class: CardClass.Scholar },
  },
  {
    id: "inferno_vanguard",
    type: CardType.Unit,
    cost: 4,
    infuse: 2,
    attack: 3,
    health: 3,
    keywords: [],
    primedCondition: { type: PrimedConditionType.INFUSED_X_TIMES, value: 2 },
    primedStats: { attack: 2, health: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_SUMMON,
        conditions: [{ type: EffectConditionType.SELF_IS_PRIMED }],
        actions: [{ type: EffectType.BUFF_ATTACK, target: TargetType.SELF, value: 1 }],
      },
    ],
    metadata: { rarity: Rarity.Rare, class: CardClass.Warrior },
  },
]
