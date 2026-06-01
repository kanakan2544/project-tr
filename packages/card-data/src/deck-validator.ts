import { CardClass } from "@tcg/shared-types"
import type { DeckValidationResult } from "@tcg/shared-types"
import { getCard } from "./registry"

/** Deck-construction rules (see docs/RULEBOOK.md). */
export const DECK_SIZE = 30
export const MAX_COPIES = 2

/**
 * Validate a deck against construction rules. Single source of truth — the web
 * deck builder runs this live and the game server re-runs it on join (server
 * stays authoritative). Pure: depends only on the card registry.
 */
export function validateDeck(cardIds: readonly string[], aceCardId: string): DeckValidationResult {
  const errors: string[] = []

  // --- Ace must exist and be legendary ---
  let aceClass: CardClass | null = null
  try {
    const ace = getCard(aceCardId)
    if (!ace.metadata.isLegendary) {
      errors.push(`Ace card "${aceCardId}" must be a Legendary card.`)
    }
    aceClass = ace.metadata.class
  } catch {
    errors.push(`Ace card "${aceCardId}" does not exist.`)
  }

  // --- Deck size ---
  if (cardIds.length !== DECK_SIZE) {
    errors.push(`Deck must contain exactly ${DECK_SIZE} cards (has ${cardIds.length}).`)
  }

  // --- Copy limit + per-card existence + class restriction ---
  const counts = new Map<string, number>()
  for (const id of cardIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  for (const [id, count] of counts) {
    if (count > MAX_COPIES) {
      errors.push(`Too many copies of "${id}" (${count}); max ${MAX_COPIES}.`)
    }
    let card
    try {
      card = getCard(id)
    } catch {
      errors.push(`Card "${id}" does not exist.`)
      continue
    }
    // Class restriction: must match the Ace's class or be Neutral.
    if (aceClass !== null && card.metadata.class !== aceClass && card.metadata.class !== CardClass.Neutral) {
      errors.push(`Card "${id}" (${card.metadata.class}) does not match Ace class ${aceClass} and is not Neutral.`)
    }
  }

  return { valid: errors.length === 0, errors }
}
