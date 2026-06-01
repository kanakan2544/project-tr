import type { CardDefinition } from "@tcg/shared-types"
import { warriorCards } from "./cards/warriors"
import { spellCards } from "./cards/spells"
import { legendaryCards } from "./cards/legendary"
import { phase2Cards } from "./cards/phase2"
import { testCards } from "./cards/test-cards"
import { invincibleCards } from "./cards/invincible"

const ALL_CARDS: CardDefinition[] = [...warriorCards, ...spellCards, ...legendaryCards, ...phase2Cards, ...testCards, ...invincibleCards]

const cardRegistry = new Map<string, CardDefinition>(
  ALL_CARDS.map((card) => [card.id, card])
)

export function getCard(id: string): CardDefinition {
  const card = cardRegistry.get(id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}

export function getAllCards(): readonly CardDefinition[] {
  return ALL_CARDS
}

export function registerCard(card: CardDefinition): void {
  cardRegistry.set(card.id, card)
}
