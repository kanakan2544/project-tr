import { CardClass, CardType, EffectType, Rarity, SpellType, TargetType, TriggerType } from "@tcg/shared-types"
import type { SpellCardDefinition } from "@tcg/shared-types"

export const spellCards: SpellCardDefinition[] = [
  {
    id: "quick_strike",
    type: CardType.Spell,
    cost: 2,
    infuse: 1,
    spellType: SpellType.Normal,
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_PLAY,
        actions: [{ type: EffectType.DEAL_DAMAGE, target: TargetType.ENEMY_UNIT, value: 3 }],
      },
    ],
    metadata: { rarity: Rarity.Common, class: CardClass.Warrior },
  },
  {
    id: "restoration",
    type: CardType.Spell,
    cost: 3,
    infuse: 1,
    spellType: SpellType.Normal,
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_PLAY,
        actions: [{ type: EffectType.HEAL, target: TargetType.ALLY_PLAYER, value: 4 }],
      },
    ],
    metadata: { rarity: Rarity.Common, class: CardClass.Scholar },
  },
  {
    id: "silence_bolt",
    type: CardType.Spell,
    cost: 2,
    infuse: 1,
    spellType: SpellType.Normal,
    abilities: [
      {
        kind: "triggered",
        trigger: TriggerType.ON_PLAY,
        actions: [{ type: EffectType.SILENCE, target: TargetType.ENEMY_UNIT }],
      },
    ],
    metadata: { rarity: Rarity.Uncommon, class: CardClass.Scholar },
  },
]
