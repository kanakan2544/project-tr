import { Room, Client } from "colyseus"
import { GameEngine, createInitialGameState } from "@tcg/game-engine"
import { validateDeck } from "@tcg/card-data"
import { prisma } from "@tcg/db"
import type { GameAction, PlayerId } from "@tcg/shared-types"
import { sanitizeStateForPlayer } from "./state-sanitizer"
import { verifyMatchToken } from "../auth/match-token"

interface JoinOptions {
  matchKey: string
  token: string
}

export class GameRoom extends Room {
  private engine: GameEngine | null = null
  private sessionToPlayer = new Map<string, PlayerId>()
  private sessionToUser = new Map<string, string>()
  private playerDecks = new Map<PlayerId, { deckCardIds: string[]; aceCardId: string }>()
  private readyClients = new Set<string>()
  private gameStarted = false

  override onCreate(): void {
    // 4 slots: 2 real players + 2 StrictMode ghost connections per tab
    this.maxClients = 4
    this.autoDispose = true

    this.onMessage("ready", (client: Client) => {
      if (this.gameStarted) return
      this.readyClients.add(client.sessionId)
      // Only count sessions that are still actively connected — guards against
      // React StrictMode ghost connections that joined and left before this check.
      const connectedReady = [...this.readyClients].filter((id) =>
        this.clients.some((c) => c.sessionId === id)
      )
      if (connectedReady.length >= 2) {
        this.gameStarted = true
        this.lock()
        this.initializeGame()
      }
    })

    this.onMessage("message", (client: Client, data: { action: GameAction }) => {
      try {
        if (!this.engine) return

        const playerId = this.sessionToPlayer.get(client.sessionId)
        if (!playerId) return

        const action = data.action
        if (!action) return

        const authorizedAction = { ...action, playerId }
        const result = this.engine.dispatch(authorizedAction)

        if (!result.success) {
          client.send("ACTION_REJECTED", { error: result.error })
          return
        }

        this.broadcastGameState()

        if (result.events && result.events.length > 0) {
          this.broadcast("GAME_EVENTS", result.events)
        }
      } catch (err) {
        console.error("[GameRoom] dispatch error:", err)
        client.send("ACTION_REJECTED", { error: "INTERNAL_ERROR" })
      }
    })
  }

  override async onJoin(client: Client, options: JoinOptions): Promise<void> {
    const playerId = client.sessionId

    // Authoritative deck load: verify the match token, then read the deck from
    // the DB and re-validate it server-side. Throwing rejects the join.
    const { userId, deckId } = await verifyMatchToken(options.token)
    const deck = await prisma.deck.findUnique({ where: { id: deckId } })
    if (!deck || deck.userId !== userId) {
      throw new Error("Deck not found or not owned by player")
    }
    const result = validateDeck(deck.cardIds, deck.aceCardId)
    if (!result.valid) {
      throw new Error(`Invalid deck: ${result.errors.join("; ")}`)
    }

    this.sessionToPlayer.set(client.sessionId, playerId)
    this.sessionToUser.set(client.sessionId, userId)
    this.playerDecks.set(playerId, {
      deckCardIds: deck.cardIds,
      aceCardId: deck.aceCardId,
    })
    client.send("PLAYER_ASSIGNED", { playerId })
  }

  override async onLeave(client: Client, consented: boolean): Promise<void> {
    const playerId = this.sessionToPlayer.get(client.sessionId)

    if (this.gameStarted && !consented && playerId) {
      this.broadcast("PLAYER_DISCONNECTED", { playerId })

      try {
        // Wait up to 30s for the player to reconnect
        await this.allowReconnection(client, 30)

        // Reconnected — re-send current state
        if (this.engine) {
          const state = this.engine.getState()
          const sanitized = sanitizeStateForPlayer(state, playerId)
          client.send("GAME_STATE", sanitized)
        }
        this.broadcast("PLAYER_RECONNECTED", { playerId })
      } catch {
        // Timed out — permanently remove
        this.removePlayer(client.sessionId, playerId)
        this.broadcast("PLAYER_TIMEOUT", { playerId })
      }
    } else {
      this.removePlayer(client.sessionId, playerId)
      if (playerId && this.gameStarted) {
        this.broadcast("PLAYER_DISCONNECTED", { playerId })
      }
    }
  }

  private removePlayer(sessionId: string, playerId?: PlayerId): void {
    this.sessionToPlayer.delete(sessionId)
    this.sessionToUser.delete(sessionId)
    if (playerId) this.playerDecks.delete(playerId)
    this.readyClients.delete(sessionId)
  }

  private initializeGame(): void {
    const playerIds = [...this.readyClients]
    const [p1Id, p2Id] = playerIds
    if (!p1Id || !p2Id) return

    const p1Config = this.playerDecks.get(p1Id)!
    const p2Config = this.playerDecks.get(p2Id)!

    const initialState = createInitialGameState(
      this.roomId,
      p1Id,
      p2Id,
      p1Config.deckCardIds,
      p2Config.deckCardIds,
      p1Config.aceCardId,
      p2Config.aceCardId,
      Date.now()
    )

    this.engine = new GameEngine(initialState)
    this.broadcastGameState()
  }

  private broadcastGameState(): void {
    if (!this.engine) return
    const state = this.engine.getState()

    for (const client of this.clients) {
      if (!this.readyClients.has(client.sessionId)) continue
      const playerId = this.sessionToPlayer.get(client.sessionId)
      if (!playerId) continue
      const sanitized = sanitizeStateForPlayer(state, playerId)
      client.send("GAME_STATE", sanitized)
    }
  }
}
