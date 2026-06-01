"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GameClient } from "@/lib/colyseus-client"
import type { ClientGameState } from "@/lib/types"
import type { GameAction, GameEvent } from "@tcg/shared-types"

export type ConnectionStatus =
  | "connecting"
  | "reconnecting"
  | "waiting"
  | "playing"
  | "opponent_disconnected"
  | "opponent_timeout"
  | "disconnected"

export function useGameClient(roomId: string) {
  const clientRef = useRef<GameClient | null>(null)
  // cancelledRef guards handler callbacks (survives re-renders, prevents setState after unmount)
  const cancelledRef = useRef(false)
  const storageKey = `tcg-reconnect-${roomId}`
  const storageKeyRef = useRef(storageKey)
  storageKeyRef.current = storageKey

  const [gameState, setGameState] = useState<ClientGameState | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [playerId, setPlayerId] = useState<string>("")
  const [lastError, setLastError] = useState<string | null>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [latestBatch, setLatestBatch] = useState<GameEvent[]>([])

  const registerHandlers = useCallback((client: GameClient) => {
    client.onStateUpdate((state) => {
      if (cancelledRef.current) return
      setGameState(state)
      setStatus("playing")
    })

    client.onEvents((evs) => {
      if (cancelledRef.current) return
      setEvents((prev) => [...prev, ...evs])
      setLatestBatch(evs)
    })

    client.onActionRejected((data) => {
      if (cancelledRef.current) return
      setLastError(data.error)
    })

    client.onPlayerDisconnected(() => {
      if (cancelledRef.current) return
      setStatus("opponent_disconnected")
    })

    client.onPlayerReconnected(() => {
      if (cancelledRef.current) return
      setStatus("playing")
    })

    client.onPlayerTimeout(() => {
      if (cancelledRef.current) return
      setStatus("opponent_timeout")
    })

    client.onDisconnected(async (code) => {
      if (cancelledRef.current) return
      if (code === 4000) return

      const token = localStorage.getItem(storageKeyRef.current)
      if (!token) {
        setStatus("disconnected")
        return
      }

      setStatus("reconnecting")
      try {
        await client.reconnect(token)
        if (cancelledRef.current) return
        registerHandlers(client)
      } catch {
        if (cancelledRef.current) return
        setStatus("disconnected")
        localStorage.removeItem(storageKeyRef.current)
      }
    })
  }, []) // stable — reads only refs

  useEffect(() => {
    cancelledRef.current = false
    // local boolean: isolated to THIS effect invocation's async code.
    // Prevents the remount's `cancelledRef.current = false` from unblocking the
    // ghost connection's still-in-flight connect() and causing it to sendReady().
    let effectCancelled = false

    const client = new GameClient()
    clientRef.current = client

    const connect = async () => {
      const storedToken = localStorage.getItem(storageKey)
      if (storedToken) {
        try {
          setStatus("reconnecting")
          await client.reconnect(storedToken)
          if (effectCancelled) return
          setPlayerId(client.getSessionId())
          registerHandlers(client)
          return
        } catch {
          localStorage.removeItem(storageKey)
        }
      }

      setStatus("connecting")

      // Exchange the chosen deck (picked in the lobby) for a server-trusted
      // match token. The server loads the authoritative deck from the DB.
      const deckId = sessionStorage.getItem(`tcg-deck-${roomId}`)
      if (!deckId) {
        setLastError("No deck selected — pick a deck in the lobby.")
        setStatus("disconnected")
        return
      }
      const tokenRes = await fetch("/api/match-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId }),
      })
      if (!tokenRes.ok) {
        setLastError("Could not authorize your deck.")
        setStatus("disconnected")
        return
      }
      const { token: matchToken } = (await tokenRes.json()) as { token: string }

      await client.joinGame(roomId, matchToken)
      if (effectCancelled) { client.disconnect(); return }

      const token = client.reconnectionToken
      if (token) localStorage.setItem(storageKey, token)

      setPlayerId(client.getSessionId())
      setStatus("waiting")
      registerHandlers(client)
      client.sendReady()
    }

    connect().catch((err) => {
      if (!effectCancelled) {
        console.error("[useGameClient]", err)
        setStatus("disconnected")
      }
    })

    return () => {
      cancelledRef.current = true
      effectCancelled = true
      clientRef.current?.disconnect()
      clientRef.current = null
    }
  }, [roomId, storageKey, registerHandlers])

  const sendAction = useCallback((action: GameAction) => {
    setLastError(null)
    clientRef.current?.sendAction(action)
  }, [])

  return { gameState, sendAction, status, playerId, lastError, events, latestBatch }
}
