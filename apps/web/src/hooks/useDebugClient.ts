"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { DebugClient } from "@/lib/debug-client"
import { TEST_CARD_STORAGE_KEY } from "@/components/editor/draft-to-card"
import type { CardDefinition, GameState, GameAction, GameEvent } from "@tcg/shared-types"

export interface EventLogEntry {
  id: number
  actionType: string
  events: GameEvent[]
  timestamp: number
}

export interface HistoryEntry {
  state: GameState
  actionType: string
}

export function useDebugClient() {
  const clientRef = useRef<DebugClient | null>(null)
  const historyRef = useRef<HistoryEntry[]>([])
  const historyIndexRef = useRef<number>(-1)
  const eventIdRef = useRef<number>(0)

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([])
  const [historyLen, setHistoryLen] = useState(0)
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const client = new DebugClient()

    client
      .connect()
      .then(() => {
        if (cancelled) { client.disconnect(); return }
        clientRef.current = client
        setConnected(true)

        const pendingCard = localStorage.getItem(TEST_CARD_STORAGE_KEY)
        if (pendingCard) {
          localStorage.removeItem(TEST_CARD_STORAGE_KEY)
          try {
            const card = JSON.parse(pendingCard) as CardDefinition
            client.injectCard(card)
          } catch { /* ignore malformed */ }
        }

        client.onState((state) => {
          setGameState(state)
        })

        client.onEvents((batch) => {
          setGameState((prev) => {
            if (prev) {
              historyRef.current = [
                ...historyRef.current.slice(0, historyIndexRef.current + 1),
                { state: prev, actionType: batch.actionType },
              ]
              historyIndexRef.current = historyRef.current.length - 1
              setHistoryLen(historyRef.current.length)
              setHistoryIndex(historyIndexRef.current)
            }
            return prev
          })
          setEventLog((log) => [
            {
              id: ++eventIdRef.current,
              actionType: batch.actionType,
              events: batch.events,
              timestamp: Date.now(),
            },
            ...log.slice(0, 99),
          ])
          setLastError(null)
        })

        client.onError((err) => {
          setLastError(err.error)
        })
      })
      .catch((err: unknown) => {
        if (!cancelled) setConnectError(err instanceof Error ? err.message : "Could not reach debug server")
      })

    return () => {
      cancelled = true
      clientRef.current?.disconnect()
      clientRef.current = null
    }
  }, [])

  const dispatch = useCallback((playerId: string, action: GameAction) => {
    clientRef.current?.dispatch(playerId, action)
  }, [])

  const reset = useCallback(() => {
    historyRef.current = []
    historyIndexRef.current = -1
    setHistoryLen(0)
    setHistoryIndex(-1)
    setEventLog([])
    setLastError(null)
    clientRef.current?.reset()
  }, [])

  const stepBack = useCallback(() => {
    const idx = historyIndexRef.current
    if (idx < 0 || historyRef.current.length === 0) return
    const entry = historyRef.current[idx]
    if (!entry) return
    historyIndexRef.current = idx - 1
    setHistoryIndex(idx - 1)
    clientRef.current?.loadState(entry.state)
    setGameState(entry.state)
  }, [])

  return {
    gameState,
    connected,
    connectError,
    eventLog,
    lastError,
    historyLen,
    historyIndex,
    dispatch,
    reset,
    stepBack,
  }
}
