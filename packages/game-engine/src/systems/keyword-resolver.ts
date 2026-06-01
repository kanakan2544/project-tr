import { Keyword } from "@tcg/shared-types"
import type { UnitInstance } from "@tcg/shared-types"

export function hasKeyword(unit: UnitInstance, keyword: Keyword): boolean {
  if (unit.status.silenced) return false
  return unit.keywords.includes(keyword)
}

export function applySummonKeywords(unit: UnitInstance): void {
  if (unit.keywords.includes(Keyword.Charge)) {
    unit.status.standBy = false
  }
  if (unit.keywords.includes(Keyword.Spellshield)) {
    unit.status.spellshieldActive = true
  }
  if (unit.keywords.includes(Keyword.Barrier)) {
    unit.status.barrierActive = true
  }
}
