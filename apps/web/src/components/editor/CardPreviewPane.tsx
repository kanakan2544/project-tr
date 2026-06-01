"use client"

import React from "react"
import { CardType, Rarity } from "@tcg/shared-types"
import type { CardDraft } from "./types"

const DEFAULT_ART =
  "https://drive.google.com/uc?export=view&id=1KCZ97tlUCs_cj0xSVqSJlxrC6uzGBRZ7"

const RARITY_SHADOW: Record<Rarity, string> = {
  [Rarity.Common]: "shadow-ink-sm",
  [Rarity.Uncommon]: "shadow-[4px_4px_0_#6ab87a]",
  [Rarity.Rare]: "shadow-[4px_4px_0_#a8b8e8]",
  [Rarity.Legendary]: "shadow-[4px_4px_0_#e8a832]",
}

const BADGE =
  "rounded-sm border-[2px] border-ink font-mono font-bold shadow-[1px_1px_0_#15131a]"

interface Props {
  draft: CardDraft
}

export function CardPreviewPane({ draft }: Props) {
  const shadow = RARITY_SHADOW[draft.rarity] ?? "shadow-ink-sm"
  const isUnit = draft.type === CardType.Unit

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-[11px] font-bold text-ink uppercase tracking-wide">Preview</span>

      {/* Hand size card */}
      <div
        className={[
          "relative flex flex-col rounded-sm border-[3px] border-ink bg-parchment-2 text-xs select-none overflow-hidden",
          "h-36 w-28",
          shadow,
        ].join(" ")}
      >
        {/* Name row */}
        <div className={isUnit ? "bg-card-unit-light shrink-0 px-1 py-0.5" : "bg-magic-sky shrink-0 px-1 py-0.5"}>
          <span className="block w-full truncate text-center font-impact font-bold uppercase tracking-wide text-warm-brown text-[11px]">
            {draft.name || "Card Name"}
          </span>
        </div>

        {/* Art area */}
        <div className="relative overflow-hidden bg-parchment-deep shrink-0 h-[96px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DEFAULT_ART}
            alt="card art"
            className="h-full w-full object-cover"
          />

          {/* Infuse + Cost */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-0.5">
            <span className={`${BADGE} bg-gold text-ink px-1 text-[10px]`}>
              {draft.infuse}
            </span>
            <span className={`${BADGE} bg-magic-sky text-ink px-1 text-[10px]`}>
              {draft.cost}
            </span>
          </div>

          {/* ATK / HP (units only) */}
          {isUnit && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-0.5">
              <span className={`${BADGE} bg-life-red text-parchment-2 text-[11px] px-1`}>
                {draft.attack}
              </span>
              <span className={`${BADGE} bg-life-green text-parchment-2 text-[11px] px-1`}>
                {draft.health}
              </span>
            </div>
          )}
        </div>

        {/* Keywords */}
        {isUnit && draft.keywords.length > 0 && (
          <div className="flex flex-wrap gap-0.5 px-0.5 pt-0.5">
            {draft.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-sm border border-ink bg-magic-blush px-0.5 text-[7px] font-bold text-magic-purple"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Effect text */}
        <div className="flex-1 min-h-0 overflow-hidden px-0.5 pt-0.5">
          {draft.text
            ? draft.text.split("\n").map((line, i) => (
                <span key={i} className="block text-[8px] text-ink leading-tight">
                  {line}
                </span>
              ))
            : null}
        </div>
      </div>

      {/* Tooltip size card */}
      <div
        className={[
          "relative flex flex-col rounded-sm border-[3px] border-ink bg-parchment-2 text-xs select-none overflow-hidden",
          "w-64",
          shadow,
        ].join(" ")}
      >
        {/* Name row */}
        <div className={isUnit ? "bg-card-unit-light shrink-0 px-1 py-1" : "bg-magic-sky shrink-0 px-1 py-1"}>
          <span className="block w-full truncate text-center font-impact font-bold uppercase tracking-wide text-warm-brown text-[20px]">
            {draft.name || "Card Name"}
          </span>
        </div>

        {/* Art area */}
        <div className="relative overflow-hidden bg-parchment-deep shrink-0 h-[192px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DEFAULT_ART}
            alt="card art"
            className="h-full w-full object-cover"
          />

          {/* Infuse + Cost */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-0.5">
            <span className={`${BADGE} bg-gold text-ink px-1.5 py-0.5 text-[18px]`}>
              {draft.infuse}
            </span>
            <span className={`${BADGE} bg-magic-sky text-ink px-1.5 py-0.5 text-[18px]`}>
              {draft.cost}
            </span>
          </div>

          {/* ATK / HP (units only) */}
          {isUnit && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-0.5">
              <span className={`${BADGE} bg-life-red text-parchment-2 text-[20px] p-1`}>
                {draft.attack}
              </span>
              <span className={`${BADGE} bg-life-green text-parchment-2 text-[20px] p-1`}>
                {draft.health}
              </span>
            </div>
          )}
        </div>

        {/* Keywords */}
        {isUnit && draft.keywords.length > 0 && (
          <div className="flex flex-wrap gap-0.5 px-1 pt-1">
            {draft.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-sm border-[2px] border-ink bg-magic-blush px-1 text-[16px] font-bold text-magic-purple shadow-[1px_1px_0_#15131a]"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Effect text */}
        <div className="px-1 py-1 flex flex-col gap-0.5 min-h-[48px]">
          {draft.text
            ? draft.text.split("\n").map((line, i) => (
                <span key={i} className="text-[15px] text-ink leading-tight">
                  {line}
                </span>
              ))
            : null}
        </div>
      </div>
    </div>
  )
}
