import { CardType, EffectConditionType, EffectType } from "@tcg/shared-types"
import {
  EFFECT_NEEDS_CARD_ID,
  EFFECT_NEEDS_TARGET,
  EFFECT_NEEDS_VALUE,
} from "./types"
import type { CardDraft, DraftAbility, DraftAction, DraftCondition } from "./types"

function serializeAction(a: DraftAction): string {
  const parts: string[] = [`type: EffectType.${a.type}`]
  if (EFFECT_NEEDS_TARGET.has(a.type)) parts.push(`target: TargetType.${a.target}`)
  if (EFFECT_NEEDS_VALUE.has(a.type)) parts.push(`value: ${a.value}`)
  if (EFFECT_NEEDS_CARD_ID.has(a.type)) parts.push(`cardId: "${a.cardId}"`)
  return `{ ${parts.join(", ")} }`
}

function serializeCondition(c: DraftCondition): string {
  if (c.type === EffectConditionType.CONTROLS_X_UNITS) {
    return `{ type: EffectConditionType.CONTROLS_X_UNITS, value: ${c.value} }`
  }
  return `{ type: EffectConditionType.${c.type} }`
}

function serializeAbility(ab: DraftAbility): string {
  const lines: string[] = []

  if (ab.kind === "triggered") {
    lines.push(`    {`)
    lines.push(`      kind: "triggered",`)
    lines.push(`      trigger: TriggerType.${ab.trigger},`)
    if (ab.conditions.length > 0) {
      lines.push(`      conditions: [`)
      ab.conditions.forEach((c) => lines.push(`        ${serializeCondition(c)},`))
      lines.push(`      ],`)
    }
    lines.push(`      actions: [`)
    ab.actions.forEach((a) => lines.push(`        ${serializeAction(a)},`))
    lines.push(`      ],`)
    lines.push(`    }`)
  } else {
    lines.push(`    {`)
    lines.push(`      kind: "activated",`)
    if (ab.displayName) lines.push(`      displayName: "${ab.displayName}",`)
    lines.push(`      activationCost: ${ab.activationCost},`)
    lines.push(`      oncePerTurn: ${ab.oncePerTurn},`)
    if (ab.oncePerGame) lines.push(`      oncePerGame: true,`)
    if (ab.conditions.length > 0) {
      lines.push(`      conditions: [`)
      ab.conditions.forEach((c) => lines.push(`        ${serializeCondition(c)},`))
      lines.push(`      ],`)
    }
    lines.push(`      actions: [`)
    ab.actions.forEach((a) => lines.push(`        ${serializeAction(a)},`))
    lines.push(`      ],`)
    lines.push(`    }`)
  }

  return lines.join("\n")
}

export function generateCardTS(draft: CardDraft): string {
  const typeName =
    draft.type === CardType.Unit ? "UnitCardDefinition" : "SpellCardDefinition"
  const varName = draft.id || "my_card"
  const fields: string[] = []

  fields.push(`  id: "${draft.id}"`)
  fields.push(`  type: CardType.${draft.type}`)
  fields.push(`  cost: ${draft.cost}`)
  fields.push(`  infuse: ${draft.infuse}`)

  if (draft.type === CardType.Unit) {
    fields.push(`  attack: ${draft.attack}`)
    fields.push(`  health: ${draft.health}`)
    if (draft.keywords.length > 0) {
      fields.push(`  keywords: [${draft.keywords.map((k) => `Keyword.${k}`).join(", ")}]`)
    }
    if (draft.hasPrimed) {
      fields.push(
        `  primedCondition: { type: PrimedConditionType.${draft.primedConditionType}, value: ${draft.primedConditionValue} }`
      )
      const psAtk = draft.primedStatAttack !== "" ? draft.primedStatAttack : undefined
      const psHp = draft.primedStatHealth !== "" ? draft.primedStatHealth : undefined
      if (psAtk !== undefined || psHp !== undefined) {
        const ps: string[] = []
        if (psAtk !== undefined) ps.push(`attack: ${psAtk}`)
        if (psHp !== undefined) ps.push(`health: ${psHp}`)
        fields.push(`  primedStats: { ${ps.join(", ")} }`)
      }
      if (draft.primedKeywords.length > 0) {
        fields.push(
          `  primedKeywords: [${draft.primedKeywords.map((k) => `Keyword.${k}`).join(", ")}]`
        )
      }
    }
    if (draft.hasAura) {
      const ap: string[] = [`scope: "ADJACENT_ALLIES"`]
      if (draft.auraAttack !== "") ap.push(`attack: ${draft.auraAttack}`)
      if (draft.auraPerRevolve) ap.push(`perRevolve: true`)
      fields.push(`  aura: { ${ap.join(", ")} }`)
    }
  } else {
    fields.push(`  spellType: SpellType.${draft.spellType}`)
  }

  if (draft.abilities.length > 0) {
    const serialized = draft.abilities.map(serializeAbility).join(",\n")
    fields.push(`  abilities: [\n${serialized},\n  ]`)
  }

  const meta: string[] = [
    `rarity: Rarity.${draft.rarity}`,
    `class: CardClass.${draft.cardClass}`,
  ]
  if (draft.isLegendary) meta.push(`isLegendary: true`)
  fields.push(`  metadata: { ${meta.join(", ")} }`)

  return `export const ${varName}: ${typeName} = {\n${fields.join(",\n")},\n}`
}

export function generateLocaleEntry(draft: CardDraft): string {
  const entry: Record<string, string> = { name: draft.name || "Unnamed Card" }
  if (draft.text) entry.text = draft.text
  if (draft.flavorText) entry.flavorText = draft.flavorText
  return `"${draft.id || "card_id"}": ${JSON.stringify(entry, null, 2)}`
}
