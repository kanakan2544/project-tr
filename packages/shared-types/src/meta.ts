// --- Account & Meta transport types (Phase 9) ---
// Framework-free DTOs shared between the web API and the game server.
// No Prisma/ORM types leak through these — they are pure transport shapes.

/** A saved deck as returned to the client. */
export interface SavedDeckDTO {
  readonly id: string
  readonly name: string
  /** Legendary card id occupying the Ace slot (separate from the main deck). */
  readonly aceCardId: string
  /** The 30 main-deck card ids (duplicates allowed, max 2 of each). */
  readonly cardIds: readonly string[]
}

/** Payload for creating or updating a deck. */
export interface DeckInput {
  readonly name: string
  readonly aceCardId: string
  readonly cardIds: readonly string[]
}

/** Result of running deck-construction validation. */
export interface DeckValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}
