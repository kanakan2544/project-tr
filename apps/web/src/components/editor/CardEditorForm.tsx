"use client"

import React from "react"
import { CardType } from "@tcg/shared-types"
import { AbilityList } from "./AbilityList"
import { LocaleSection } from "./LocaleSection"
import { MetadataSection } from "./MetadataSection"
import { SpellSection } from "./SpellSection"
import { UnitSection } from "./UnitSection"
import type { CardDraft } from "./types"

interface Props {
  draft: CardDraft
  onChange: (patch: Partial<CardDraft>) => void
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="h-[2px] w-3 bg-ink" />
      <span className="text-[11px] font-bold text-ink uppercase tracking-widest">{title}</span>
      <div className="h-[2px] flex-1 bg-ink" />
    </div>
  )
}

export function CardEditorForm({ draft, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeader title="Identity" />
        <MetadataSection draft={draft} onChange={onChange} />
      </div>

      <div>
        <SectionHeader title="Name & Text" />
        <LocaleSection draft={draft} onChange={onChange} />
      </div>

      {draft.type === CardType.Unit ? (
        <div>
          <SectionHeader title="Unit Stats" />
          <UnitSection draft={draft} onChange={onChange} />
        </div>
      ) : (
        <div>
          <SectionHeader title="Spell" />
          <SpellSection draft={draft} onChange={onChange} />
        </div>
      )}

      <div>
        <SectionHeader title="Abilities" />
        <AbilityList
          abilities={draft.abilities}
          onChange={(abilities) => onChange({ abilities })}
        />
      </div>
    </div>
  )
}
