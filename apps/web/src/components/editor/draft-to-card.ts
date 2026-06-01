import {
  CardType,
  EffectType,
  TargetType,
} from "@tcg/shared-types"
import type {
  AbilityAction,
  AbilityCondition,
  Ability,
  CardDefinition,
  TriggeredAbility,
  UnitCardDefinition,
  SpellCardDefinition,
} from "@tcg/shared-types"
import {
  EFFECT_NEEDS_CARD_ID,
  EFFECT_NEEDS_TARGET,
  EFFECT_NEEDS_VALUE,
} from "./types"
import type { CardDraft, DraftAbility, DraftAction, DraftCondition } from "./types"

function convertAction(a: DraftAction): AbilityAction {
  const base = { type: a.type } as AbilityAction

  if (a.type === EffectType.ADD_CARD_TO_HAND) {
    return { type: a.type, cardId: a.cardId }
  }
  if (a.type === EffectType.RETURN_SELF_TO_REVOLVE) return { type: a.type }
  if (a.type === EffectType.SEND_REVOLVE_TO_DISCARD) return { type: a.type }
  if (a.type === EffectType.DRAW_CARD) return { type: a.type }

  const needsTarget = EFFECT_NEEDS_TARGET.has(a.type)
  const needsValue = EFFECT_NEEDS_VALUE.has(a.type)

  if (needsTarget && needsValue) {
    return { ...base, target: a.target, value: a.value } as AbilityAction
  }
  if (needsTarget) {
    return { ...base, target: a.target } as AbilityAction
  }
  if (needsValue) {
    return { ...base, value: a.value } as AbilityAction
  }
  return base
}

function convertCondition(c: DraftCondition): AbilityCondition {
  if (c.type === "CONTROLS_X_UNITS") {
    return { type: c.type, value: c.value }
  }
  return { type: c.type } as AbilityCondition
}

function convertAbility(ab: DraftAbility): Ability {
  const actions = ab.actions.map(convertAction)
  const conditions = ab.conditions.map(convertCondition)

  if (ab.kind === "triggered") {
    const triggered: TriggeredAbility = {
      kind: "triggered",
      trigger: ab.trigger,
      actions,
      ...(conditions.length > 0 ? { conditions } : {}),
    }
    return triggered
  } else {
    return {
      kind: "activated",
      activationCost: ab.activationCost,
      oncePerTurn: ab.oncePerTurn,
      ...(ab.oncePerGame ? { oncePerGame: true } : {}),
      ...(ab.displayName ? { displayName: ab.displayName } : {}),
      actions,
      ...(conditions.length > 0 ? { conditions } : {}),
    }
  }
}

export function draftToCardDefinition(draft: CardDraft): CardDefinition {
  const abilities = draft.abilities.length > 0
    ? draft.abilities.map(convertAbility)
    : undefined

  if (draft.type === CardType.Unit) {
    const card: UnitCardDefinition = {
      id: draft.id,
      type: CardType.Unit,
      cost: draft.cost,
      infuse: draft.infuse,
      attack: draft.attack,
      health: draft.health,
      metadata: {
        rarity: draft.rarity,
        class: draft.cardClass,
        ...(draft.isLegendary ? { isLegendary: true } : {}),
      },
      ...(draft.keywords.length > 0 ? { keywords: draft.keywords } : {}),
      ...(abilities ? { abilities } : {}),
      ...(draft.hasPrimed
        ? {
            primedCondition: {
              type: draft.primedConditionType,
              value: draft.primedConditionValue,
            },
            ...(draft.primedStatAttack !== "" || draft.primedStatHealth !== ""
              ? {
                  primedStats: {
                    ...(draft.primedStatAttack !== "" ? { attack: draft.primedStatAttack as number } : {}),
                    ...(draft.primedStatHealth !== "" ? { health: draft.primedStatHealth as number } : {}),
                  },
                }
              : {}),
            ...(draft.primedKeywords.length > 0 ? { primedKeywords: draft.primedKeywords } : {}),
          }
        : {}),
      ...(draft.hasAura
        ? {
            aura: {
              scope: "ADJACENT_ALLIES" as const,
              ...(draft.auraAttack !== "" ? { attack: draft.auraAttack as number } : {}),
              ...(draft.auraPerRevolve ? { perRevolve: true } : {}),
            },
          }
        : {}),
    }
    return card
  } else {
    const card: SpellCardDefinition = {
      id: draft.id,
      type: CardType.Spell,
      cost: draft.cost,
      infuse: draft.infuse,
      spellType: draft.spellType,
      metadata: {
        rarity: draft.rarity,
        class: draft.cardClass,
        ...(draft.isLegendary ? { isLegendary: true } : {}),
      },
      ...(abilities ? { abilities } : {}),
    }
    return card
  }
}

export const TEST_CARD_STORAGE_KEY = "tcg_test_card"
