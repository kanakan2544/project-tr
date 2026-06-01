"use client"

import { useMemo, useState } from "react"
import { getAllCards } from "@tcg/card-data"
import { CardClass, CardType } from "@tcg/shared-types"
import { CardView } from "@/components/board/CardView"
import { CardTooltipProvider } from "@/components/board/CardTooltipContext"

const CLASSES = Object.values(CardClass)

export function CollectionGrid() {
  const all = useMemo(() => [...getAllCards()].sort((a, b) => a.cost - b.cost), [])
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState<CardClass | "ALL">("ALL")
  const [typeFilter, setTypeFilter] = useState<CardType | "ALL">("ALL")

  const filtered = all.filter((c) => {
    if (classFilter !== "ALL" && c.metadata.class !== classFilter) return false
    if (typeFilter !== "ALL" && c.type !== typeFilter) return false
    if (search && !c.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <CardTooltipProvider>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="rounded-sm border-[2px] border-rim bg-panel px-3 py-1.5 font-mono text-sm text-text-primary outline-none focus:border-neon"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value as CardClass | "ALL")}
            className="rounded-sm border-[2px] border-rim bg-panel px-2 py-1.5 font-impact text-xs uppercase text-text-primary"
          >
            <option value="ALL">All classes</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CardType | "ALL")}
            className="rounded-sm border-[2px] border-rim bg-panel px-2 py-1.5 font-impact text-xs uppercase text-text-primary"
          >
            <option value="ALL">All types</option>
            {Object.values(CardType).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="ml-auto font-mono text-xs text-text-muted">{filtered.length} / {all.length} cards</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {filtered.map((card) => (
            <CardView key={card.id} cardId={card.id} size="hand" />
          ))}
        </div>
      </div>
    </CardTooltipProvider>
  )
}
