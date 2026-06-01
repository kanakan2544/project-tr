"use client"

import React, { useState } from "react"
import Link from "next/link"
import { CardEditorForm } from "@/components/editor/CardEditorForm"
import { CardPreviewPane } from "@/components/editor/CardPreviewPane"
import { ExportPanel } from "@/components/editor/ExportPanel"
import { DEFAULT_DRAFT } from "@/components/editor/types"
import type { CardDraft } from "@/components/editor/types"

export default function EditorPage() {
  const [draft, setDraft] = useState<CardDraft>(DEFAULT_DRAFT)
  const [tab, setTab] = useState<"form" | "export">("form")

  function handleChange(patch: Partial<CardDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="min-h-screen bg-parchment text-ink">
      {/* Top bar */}
      <div className="border-b-[3px] border-ink bg-parchment-2 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-sm border-[2px] border-ink bg-parchment px-3 py-1 text-[11px] font-bold text-ink hover:bg-gold/20 shadow-[2px_2px_0_#15131a] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
          >
            ← Lobby
          </Link>
          <h1 className="font-impact text-[22px] uppercase tracking-tight text-ink">
            Card Editor
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-sm border-[2px] border-ink overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("form")}
            className={[
              "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors",
              tab === "form"
                ? "bg-ink text-parchment-2"
                : "bg-parchment text-ink hover:bg-gold/20",
            ].join(" ")}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setTab("export")}
            className={[
              "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors",
              tab === "export"
                ? "bg-ink text-parchment-2"
                : "bg-parchment text-ink hover:bg-gold/20",
            ].join(" ")}
          >
            Export
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left column — form or export */}
        <div className="flex-1 overflow-y-auto border-r-[3px] border-ink p-6">
          {tab === "form" ? (
            <CardEditorForm draft={draft} onChange={handleChange} />
          ) : (
            <ExportPanel draft={draft} />
          )}
        </div>

        {/* Right column — live preview (always visible) */}
        <div className="w-72 shrink-0 overflow-y-auto bg-parchment-deep p-6">
          <CardPreviewPane draft={draft} />
        </div>
      </div>
    </div>
  )
}
