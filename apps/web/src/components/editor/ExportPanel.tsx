"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { generateCardTS, generateLocaleEntry } from "./generate-ts"
import { validateDraft } from "./validate"
import { draftToCardDefinition, TEST_CARD_STORAGE_KEY } from "./draft-to-card"
import type { CardDraft } from "./types"

interface Props {
  draft: CardDraft
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-sm border-[2px] border-ink bg-parchment px-3 py-1 text-[11px] font-bold text-ink hover:bg-gold/20 shadow-[2px_2px_0_#15131a] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
    >
      {copied ? "✓ Copied!" : label}
    </button>
  )
}

export function ExportPanel({ draft }: Props) {
  const router = useRouter()
  const errors = validateDraft(draft)
  const canExport = errors.length === 0

  function handleTestInDebug() {
    const card = draftToCardDefinition(draft)
    localStorage.setItem(TEST_CARD_STORAGE_KEY, JSON.stringify(card))
    router.push("/debug")
  }

  const cardTS = canExport ? generateCardTS(draft) : ""
  const localeEntry = canExport ? generateLocaleEntry(draft) : ""

  return (
    <div className="flex flex-col gap-4">
      {errors.length > 0 && (
        <div className="rounded-sm border-[2px] border-life-red bg-life-red/10 p-3">
          <p className="text-[11px] font-bold text-life-red uppercase tracking-wide mb-1">
            Fix before exporting:
          </p>
          <ul className="flex flex-col gap-0.5">
            {errors.map((e, i) => (
              <li key={i} className="text-[11px] text-ink">
                • {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canExport && (
        <>
          <button
            type="button"
            onClick={handleTestInDebug}
            className="w-full rounded-sm border-[2px] border-ink bg-life-green px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-parchment-2 hover:bg-life-green/80 shadow-[3px_3px_0_#15131a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            ▶ Test in Debug Sandbox
          </button>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-ink uppercase tracking-wide">
                TypeScript — paste into card-data/cards/*.ts
              </span>
              <CopyButton text={cardTS} label="Copy TS" />
            </div>
            <pre className="rounded-sm border-[2px] border-ink/30 bg-ink text-[10px] text-life-green font-mono p-3 overflow-x-auto leading-relaxed whitespace-pre">
              {cardTS}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-ink uppercase tracking-wide">
                Locale — paste into locales/en.json
              </span>
              <CopyButton text={localeEntry} label="Copy JSON" />
            </div>
            <pre className="rounded-sm border-[2px] border-ink/30 bg-ink text-[10px] text-magic-sky font-mono p-3 overflow-x-auto leading-relaxed whitespace-pre">
              {localeEntry}
            </pre>
          </div>

          <div className="rounded-sm border-[2px] border-ink/20 bg-parchment-deep p-3">
            <p className="text-[10px] font-bold text-ink uppercase tracking-wide mb-1">
              After copying:
            </p>
            <ol className="flex flex-col gap-1">
              <li className="text-[10px] text-warm-muted">
                1. Paste the TS export into the appropriate{" "}
                <code className="bg-ink/10 px-0.5 rounded-sm">packages/card-data/src/cards/*.ts</code>
              </li>
              <li className="text-[10px] text-warm-muted">
                2. Add the card to the{" "}
                <code className="bg-ink/10 px-0.5 rounded-sm">allCards</code> array in{" "}
                <code className="bg-ink/10 px-0.5 rounded-sm">packages/card-data/src/registry.ts</code>
              </li>
              <li className="text-[10px] text-warm-muted">
                3. Paste the locale entry into{" "}
                <code className="bg-ink/10 px-0.5 rounded-sm">packages/card-data/src/locales/en.json</code>
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
