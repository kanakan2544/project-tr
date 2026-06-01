import type { CardLocale, CardLocaleEntry } from "@tcg/shared-types"
import enLocale from "./en.json"

export function getCardLocale(lang: string, cardId: string): CardLocaleEntry {
  const locale = (lang === "en" ? enLocale : enLocale) as CardLocale
  return locale[cardId] ?? { name: cardId.replace(/_/g, " ") }
}
