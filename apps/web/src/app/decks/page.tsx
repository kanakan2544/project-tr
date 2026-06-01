"use client"

import { useCallback, useEffect, useState } from "react"
import { getCardLocale } from "@tcg/card-data"
import type { SavedDeckDTO } from "@tcg/shared-types"
import { DeckBuilder } from "@/components/deck/DeckBuilder"

type Editing = { mode: "new" } | { mode: "edit"; deck: SavedDeckDTO } | null

export default function DecksPage() {
  const [decks, setDecks] = useState<SavedDeckDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Editing>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/decks")
    if (res.ok) setDecks(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function remove(id: string) {
    await fetch(`/api/decks/${id}`, { method: "DELETE" })
    void load()
  }

  if (editing) {
    return (
      <main className="min-h-screen bg-void">
        <h1 className="px-6 pt-6 font-impact text-2xl uppercase tracking-tight text-text-primary">
          {editing.mode === "new" ? "New Deck" : "Edit Deck"}
        </h1>
        <DeckBuilder
          initialDeck={editing.mode === "edit" ? editing.deck : undefined}
          onSaved={() => { setEditing(null); void load() }}
          onCancel={() => setEditing(null)}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-void p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-impact text-2xl uppercase tracking-tight text-text-primary">My Decks</h1>
          <button
            onClick={() => setEditing({ mode: "new" })}
            className="rounded-sm border-[2px] border-neon bg-neon/20 px-4 py-2 font-impact text-sm uppercase text-neon transition-all hover:shadow-glow-neon"
          >
            New Deck
          </button>
        </div>

        {loading ? (
          <p className="font-mono text-sm text-text-muted">Loading…</p>
        ) : decks.length === 0 ? (
          <p className="font-mono text-sm text-text-muted">No decks yet. Create one to play.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {decks.map((deck) => (
              <li key={deck.id} className="flex items-center justify-between rounded-sm border-[2px] border-rim bg-panel p-4 shadow-panel-sm">
                <div>
                  <p className="font-impact text-sm uppercase text-text-primary">{deck.name}</p>
                  <p className="font-mono text-xs text-text-muted">
                    Ace: {getCardLocale("en", deck.aceCardId).name} · {deck.cardIds.length} cards
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing({ mode: "edit", deck })}
                    className="rounded-sm border-[2px] border-rim px-3 py-1.5 font-impact text-xs uppercase text-text-muted transition-all hover:text-neon hover:border-neon"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(deck.id)}
                    className="rounded-sm border-[2px] border-rim px-3 py-1.5 font-impact text-xs uppercase text-text-muted transition-all hover:text-life-red hover:border-life-red"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
