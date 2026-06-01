import { CardClass, CardType, Keyword, Rarity } from "@tcg/shared-types"
import type { UnitCardDefinition } from "@tcg/shared-types"

export const legendaryCards: UnitCardDefinition[] = [
  {
    id: "cyclone_sovereign",
    type: CardType.Unit,
    cost: 7,
    infuse: 4,
    attack: 7,
    health: 7,
    keywords: [Keyword.Charge, Keyword.Lifesteal],
    metadata: { rarity: Rarity.Legendary, class: CardClass.Warrior, isLegendary: true },
  },
]
