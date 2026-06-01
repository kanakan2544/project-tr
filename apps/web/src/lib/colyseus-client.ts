import { Client, Room } from "colyseus.js"
import type { GameAction } from "@tcg/shared-types"
import type { ClientGameState } from "./types"
import type { GameEvent } from "@tcg/shared-types"

const SERVER_URL = process.env["NEXT_PUBLIC_SERVER_URL"] ?? "ws://localhost:2567"

export class GameClient {
  private client: Client
  private room: Room | null = null

  constructor() {
    this.client = new Client(SERVER_URL)
  }

  async joinGame(matchKey: string, token: string): Promise<void> {
    // Server verifies `token` (HS256, shared AUTH_SECRET), then loads the
    // authoritative deck from the DB. The client never sends a raw card list.
    this.room = await this.client.joinOrCreate("game_room", {
      matchKey,
      token,
    })
  }

  async reconnect(token: string): Promise<void> {
    this.room = await this.client.reconnect(token)
  }

  get reconnectionToken(): string | null {
    return (this.room as Room & { reconnectionToken?: string })?.reconnectionToken ?? null
  }

  getSessionId(): string {
    return this.room?.sessionId ?? ""
  }

  sendAction(action: GameAction): void {
    this.room?.send("message", { action })
  }

  sendReady(): void {
    this.room?.send("ready", {})
  }

  onPlayerAssigned(callback: (data: { playerId: string }) => void): void {
    this.room?.onMessage("PLAYER_ASSIGNED", callback)
  }

  onStateUpdate(callback: (state: ClientGameState) => void): void {
    this.room?.onMessage("GAME_STATE", callback)
  }

  onEvents(callback: (events: GameEvent[]) => void): void {
    this.room?.onMessage("GAME_EVENTS", callback)
  }

  onActionRejected(callback: (data: { error: string }) => void): void {
    this.room?.onMessage("ACTION_REJECTED", callback)
  }

  onPlayerDisconnected(callback: (data: { playerId: string }) => void): void {
    this.room?.onMessage("PLAYER_DISCONNECTED", callback)
  }

  onPlayerReconnected(callback: (data: { playerId: string }) => void): void {
    this.room?.onMessage("PLAYER_RECONNECTED", callback)
  }

  onPlayerTimeout(callback: (data: { playerId: string }) => void): void {
    this.room?.onMessage("PLAYER_TIMEOUT", callback)
  }

  onDisconnected(callback: (code: number) => void): void {
    this.room?.onLeave(callback)
  }

  disconnect(): void {
    this.room?.leave()
    this.room = null
  }

  get isConnected(): boolean {
    return this.room !== null
  }
}
