"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { SavedDeckDTO } from "@tcg/shared-types"

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

/** Persist the chosen deck for a given match code; the game page reads it back. */
function storeDeckChoice(code: string, deckId: string) {
  sessionStorage.setItem(`tcg-deck-${code}`, deckId)
}

export function MatchLobby() {
  const router = useRouter()
  const [decks, setDecks] = useState<SavedDeckDTO[]>([])
  const [deckId, setDeckId] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/decks")
      if (!res.ok) return
      const data: SavedDeckDTO[] = await res.json()
      setDecks(data)
      if (data[0]) setDeckId(data[0].id)
    })()
  }, [])

  const noDeck = deckId === ""

  function handleCreate() {
    if (noDeck) return
    const code = generateCode()
    storeDeckChoice(code, deckId)
    setCreatedCode(code)
    router.push(`/game/${code}`)
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (noDeck) { setJoinError("Select a deck first"); return }
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) { setJoinError("Enter a valid match code"); return }
    setJoinError("")
    storeDeckChoice(code, deckId)
    router.push(`/game/${code}`)
  }

  async function copyCode() {
    if (!createdCode) return
    await navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      {/* Deck selector */}
      <div className="w-full rounded-sm border-[2px] border-rim bg-panel p-5 shadow-panel">
        <p className="mb-1 font-impact text-xs uppercase tracking-tight text-text-muted">YOUR DECK</p>
        {decks.length === 0 ? (
          <Link
            href="/decks"
            className="mt-3 block w-full rounded-sm border-[2px] border-neon bg-neon/10 py-2.5 text-center font-impact text-sm uppercase text-neon transition-all hover:bg-neon/20"
          >
            Build a deck first
          </Link>
        ) : (
          <select
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
            className="mt-3 w-full rounded-sm border-[2px] border-rim bg-panel-mid px-3 py-2 font-mono text-sm text-text-primary"
          >
            {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      {/* Create match */}
      <div className="w-full rounded-sm border-[2px] border-rim bg-panel p-5 shadow-panel">
        <p className="mb-1 font-impact text-xs uppercase tracking-tight text-text-muted">START A NEW MATCH</p>
        {createdCode ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="flex-1 rounded-sm border-[2px] border-neon bg-neon/15 px-3 py-2 font-mono text-lg font-bold tracking-widest text-neon shadow-glow-neon">
              {createdCode}
            </span>
            <button
              onClick={copyCode}
              className="rounded-sm border-[2px] border-rim bg-panel px-3 py-2 font-impact text-xs uppercase text-text-primary shadow-panel-sm transition-all hover:bg-neon/20 hover:text-neon hover:border-neon hover:shadow-none"
            >
              {copied ? "DONE!" : "COPY"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleCreate}
            disabled={noDeck}
            className="mt-3 w-full rounded-sm border-[2px] border-neon bg-neon/20 py-2.5 font-impact text-base uppercase tracking-tight text-neon shadow-glow-neon transition-all hover:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            CREATE MATCH
          </button>
        )}
      </div>

      <div className="flex w-full items-center gap-2">
        <div className="h-[2px] flex-1 bg-rim/40" />
        <span className="rounded-sm border-[2px] border-rim bg-panel px-2 py-0.5 font-impact text-xs uppercase text-text-muted">OR</span>
        <div className="h-[2px] flex-1 bg-rim/40" />
      </div>

      {/* Join match */}
      <div className="w-full rounded-sm border-[2px] border-rim bg-panel p-5 shadow-panel">
        <p className="mb-1 font-impact text-xs uppercase tracking-tight text-text-muted">JOIN WITH A CODE</p>
        <form onSubmit={handleJoin} className="mt-3 flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value); setJoinError("") }}
            placeholder="ABCDEF"
            maxLength={8}
            className="flex-1 rounded-sm border-[2px] border-rim bg-panel px-3 py-2 font-mono text-sm uppercase font-bold tracking-widest text-text-primary placeholder-text-muted2 outline-none shadow-panel-sm transition-all focus:shadow-glow-neon focus:border-neon/80"
          />
          <button
            type="submit"
            disabled={noDeck}
            className="rounded-sm border-[2px] border-rim bg-panel px-4 py-2 font-impact text-sm uppercase text-text-primary shadow-panel-sm transition-all hover:bg-neon/20 hover:text-neon hover:border-neon hover:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            JOIN
          </button>
        </form>
        {joinError && <p className="mt-2 font-impact text-xs uppercase text-life-red">{joinError}</p>}
      </div>

      <Link
        href="/debug"
        className="rounded-sm border-[2px] border-rim/30 px-3 py-1 font-impact text-xs uppercase text-text-muted2 transition-all hover:border-rim hover:text-text-muted"
      >
        DEBUG SANDBOX
      </Link>
    </div>
  )
}
