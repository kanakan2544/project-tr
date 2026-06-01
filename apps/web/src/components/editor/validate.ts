import { CardType } from "@tcg/shared-types"
import { EFFECT_NEEDS_CARD_ID, EFFECT_NEEDS_VALUE } from "./types"
import type { CardDraft } from "./types"

export function validateDraft(draft: CardDraft): string[] {
  const errors: string[] = []

  if (!draft.id) {
    errors.push("ID is required")
  } else if (!/^[a-z0-9_]+$/.test(draft.id)) {
    errors.push("ID must be lowercase letters, numbers, and underscores only")
  }

  if (!draft.name) errors.push("Card name is required")

  if (!Number.isInteger(draft.cost) || draft.cost < 0)
    errors.push("Cost must be a non-negative integer")
  if (!Number.isInteger(draft.infuse) || draft.infuse < 0)
    errors.push("Infuse must be a non-negative integer")

  if (draft.type === CardType.Unit) {
    if (!Number.isInteger(draft.attack) || draft.attack < 0)
      errors.push("Attack must be a non-negative integer")
    if (!Number.isInteger(draft.health) || draft.health < 1)
      errors.push("Health must be a positive integer")
  }

  for (let i = 0; i < draft.abilities.length; i++) {
    const ab = draft.abilities[i]!
    if (ab.actions.length === 0) {
      errors.push(`Ability ${i + 1}: must have at least one action`)
    }
    for (let j = 0; j < ab.actions.length; j++) {
      const action = ab.actions[j]!
      if (EFFECT_NEEDS_VALUE.has(action.type) && (action.value < 0 || !Number.isFinite(action.value))) {
        errors.push(`Ability ${i + 1}, Action ${j + 1}: value must be ≥ 0`)
      }
      if (EFFECT_NEEDS_CARD_ID.has(action.type) && !action.cardId) {
        errors.push(`Ability ${i + 1}, Action ${j + 1}: card ID is required`)
      }
    }
  }

  return errors
}
