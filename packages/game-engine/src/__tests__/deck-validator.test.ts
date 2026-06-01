import { describe, it, expect } from "vitest"
import { getAllCards, validateDeck, DECK_SIZE, MAX_COPIES } from "@tcg/card-data"
import { CardClass } from "@tcg/shared-types"

// Co-located in game-engine because card-data has no test runner of its own
// (game-engine already runs Vitest and may depend on card-data).

const cards = getAllCards()

function eligibleFor(cls: CardClass) {
  return cards.filter((c) => c.metadata.class === cls || c.metadata.class === CardClass.Neutral)
}

// Pick the legendary whose class has the deepest eligible pool, so a 30-card
// deck (max 2 copies → needs 15 distinct) is buildable regardless of registry size.
const legendaryAce = cards
  .filter((c) => c.metadata.isLegendary)
  .map((c) => ({ c, n: eligibleFor(c.metadata.class).length }))
  .sort((a, b) => b.n - a.n)[0]!.c
const aceClass = legendaryAce.metadata.class
const eligible = eligibleFor(aceClass)

/** Build a legal 30-card deck from eligible cards, max 2 copies each. */
function buildValidDeck(): string[] {
  const deck: string[] = []
  while (deck.length < DECK_SIZE) {
    let added = false
    for (const card of eligible) {
      const count = deck.filter((id) => id === card.id).length
      if (count < MAX_COPIES) {
        deck.push(card.id)
        added = true
        if (deck.length === DECK_SIZE) break
      }
    }
    if (!added) throw new Error("Not enough eligible cards to build a 30-card deck")
  }
  return deck
}

describe("validateDeck", () => {
  const validDeck = buildValidDeck()

  it("accepts a legal 30-card deck", () => {
    const result = validateDeck(validDeck, legendaryAce.id)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("rejects a deck with fewer than 30 cards", () => {
    const result = validateDeck(validDeck.slice(0, 29), legendaryAce.id)
    expect(result.valid).toBe(false)
  })

  it("rejects a deck with more than 30 cards", () => {
    const result = validateDeck([...validDeck, validDeck[0]!], legendaryAce.id)
    expect(result.valid).toBe(false)
  })

  it("rejects more than 2 copies of a card", () => {
    // Replace the last entry so one card appears 3 times while length stays 30.
    const distinct = eligible[0]!.id
    const deck = [distinct, distinct, distinct, ...validDeck.filter((id) => id !== distinct)].slice(0, DECK_SIZE)
    // Ensure the triple survived the slice.
    if (deck.filter((id) => id === distinct).length < 3) deck[3] = distinct
    const result = validateDeck(deck, legendaryAce.id)
    expect(result.valid).toBe(false)
  })

  it("rejects a non-legendary ace", () => {
    const nonLegendary = cards.find((c) => !c.metadata.isLegendary)!
    const result = validateDeck(validDeck, nonLegendary.id)
    expect(result.valid).toBe(false)
  })

  it("rejects an off-class card", () => {
    const offClass = cards.find(
      (c) => c.metadata.class !== aceClass && c.metadata.class !== CardClass.Neutral
    )
    if (!offClass) return // no off-class card in registry — nothing to assert
    const deck = [offClass.id, ...validDeck.slice(1)]
    const result = validateDeck(deck, legendaryAce.id)
    expect(result.valid).toBe(false)
  })

  it("rejects a non-existent ace", () => {
    const result = validateDeck(validDeck, "does_not_exist")
    expect(result.valid).toBe(false)
  })
})
