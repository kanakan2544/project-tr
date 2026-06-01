"use client"

import { useMemo, useState } from "react"
import { getAllCards, getCard, validateDeck, DECK_SIZE, MAX_COPIES } from "@tcg/card-data"
import { getCardLocale } from "@tcg/card-data"
import { CardClass } from "@tcg/shared-types"
import type { SavedDeckDTO } from "@tcg/shared-types"
import { CardView } from "@/components/board/CardView"
import { CardTooltipProvider } from "@/components/board/CardTooltipContext"

interface Props {
  initialDeck?: SavedDeckDTO | undefined
  onSaved: () => void
  onCancel: () => void
}

const LEGENDARIES = getAllCards().filter((c) => c.metadata.isLegendary)

function cardName(id: string): string {
  return getCardLocale("en", id).name
}

export function DeckBuilder({ initialDeck, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initialDeck?.name ?? "")
  const [aceCardId, setAceCardId] = useState(initialDeck?.aceCardId ?? LEGENDARIES[0]?.id ?? "")
  const [cardIds, setCardIds] = useState<string[]>(initialDeck ? [...initialDeck.cardIds] : [])
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const aceClass = useMemo(() => {
    try { return getCard(aceCardId).metadata.class } catch { return null }
  }, [aceCardId])

  // Pool = non-legendary cards matching the Ace class or Neutral.
  const pool = useMemo(() => {
    return [...getAllCards()]
      .filter((c) => !c.metadata.isLegendary)
      .filter((c) => aceClass === null || c.metadata.class === aceClass || c.metadata.class === CardClass.Neutral)
      .sort((a, b) => a.cost - b.cost)
  }, [aceClass])

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const id of cardIds) m.set(id, (m.get(id) ?? 0) + 1)
    return m
  }, [cardIds])

  const validation = useMemo(() => validateDeck(cardIds, aceCardId), [cardIds, aceCardId])

  function addCard(id: string) {
    if (cardIds.length >= DECK_SIZE) return
    if ((counts.get(id) ?? 0) >= MAX_COPIES) return
    setCardIds((prev) => [...prev, id])
  }

  function removeCard(id: string) {
    setCardIds((prev) => {
      const i = prev.lastIndexOf(id)
      if (i === -1) return prev
      const next = [...prev]
      next.splice(i, 1)
      return next
    })
  }

  // Distinct deck entries, sorted by cost then name.
  const deckEntries = useMemo(() => {
    return [...counts.entries()]
      .map(([id, count]) => ({ id, count, cost: (() => { try { return getCard(id).cost } catch { return 0 } })() }))
      .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))
  }, [counts])

  async function save() {
    setSaving(true)
    setServerError(null)
    const payload = { name: name.trim(), aceCardId, cardIds }
    const url = initialDeck ? `/api/decks/${initialDeck.id}` : "/api/decks"
    const method = initialDeck ? "PUT" : "POST"
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setServerError([data.error, ...(data.details ?? [])].filter(Boolean).join(" — ") || "Save failed")
        return
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const canSave = validation.valid && name.trim().length > 0 && !saving

  return (
    <CardTooltipProvider>
      <div className="flex flex-col gap-4 p-6 lg:flex-row">
        {/* Card pool */}
        <section className="flex-1">
          <h2 className="mb-2 font-impact text-sm uppercase text-text-muted">Card Pool ({pool.length})</h2>
          <div className="flex flex-wrap gap-2">
            {pool.map((card) => {
              const count = counts.get(card.id) ?? 0
              const maxed = count >= MAX_COPIES
              const full = cardIds.length >= DECK_SIZE
              return (
                <div key={card.id} className="relative">
                  <CardView
                    cardId={card.id}
                    size="hand"
                    disabled={maxed || full}
                    onClick={() => addCard(card.id)}
                  />
                  {count > 0 && (
                    <span className="absolute -right-1 -top-1 z-10 rounded-full border-[2px] border-neon bg-panel px-1.5 font-mono text-xs font-bold text-neon">
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Deck side panel */}
        <aside className="w-full shrink-0 lg:w-80">
          <div className="sticky top-4 flex flex-col gap-3 rounded-sm border-[2px] border-rim bg-panel p-4 shadow-panel">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Deck name"
              className="rounded-sm border-[2px] border-rim bg-panel-mid px-3 py-2 font-impact text-sm uppercase text-text-primary outline-none focus:border-neon"
            />

            <label className="font-impact text-xs uppercase text-text-muted">Ace (Legendary)</label>
            <select
              value={aceCardId}
              onChange={(e) => setAceCardId(e.target.value)}
              className="rounded-sm border-[2px] border-rim bg-panel-mid px-2 py-2 font-mono text-sm text-text-primary"
            >
              {LEGENDARIES.map((c) => (
                <option key={c.id} value={c.id}>{cardName(c.id)} ({c.metadata.class})</option>
              ))}
            </select>

            <div className="flex items-center justify-between font-impact text-sm uppercase">
              <span className="text-text-muted">Cards</span>
              <span className={cardIds.length === DECK_SIZE ? "text-life-green" : "text-life-red"}>
                {cardIds.length} / {DECK_SIZE}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {deckEntries.length === 0 && <p className="font-mono text-xs text-text-muted2">Click cards to add them.</p>}
              {deckEntries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => removeCard(e.id)}
                  className="flex w-full items-center justify-between border-b border-rim/30 px-1 py-1 text-left font-mono text-xs text-text-primary transition-colors hover:bg-life-red/20"
                >
                  <span className="truncate">{e.count}× {cardName(e.id)}</span>
                  <span className="text-text-muted2">{e.cost}</span>
                </button>
              ))}
            </div>

            {!validation.valid && (
              <ul className="flex flex-col gap-0.5 rounded-sm border border-life-red/40 bg-life-red/10 p-2">
                {validation.errors.map((err, i) => (
                  <li key={i} className="font-mono text-[10px] leading-tight text-life-red">{err}</li>
                ))}
              </ul>
            )}
            {serverError && <p className="font-mono text-[10px] text-life-red">{serverError}</p>}

            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={!canSave}
                className="flex-1 rounded-sm border-[2px] border-neon bg-neon/20 py-2 font-impact text-sm uppercase text-neon transition-all enabled:hover:shadow-glow-neon disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={onCancel}
                className="rounded-sm border-[2px] border-rim px-3 py-2 font-impact text-sm uppercase text-text-muted transition-all hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </aside>
      </div>
    </CardTooltipProvider>
  )
}
