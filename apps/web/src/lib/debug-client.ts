import { Client, Room } from "colyseus.js"
import type { CardDefinition, GameAction, GameState, GameEvent } from "@tcg/shared-types"

const SERVER_URL = process.env["NEXT_PUBLIC_SERVER_URL"] ?? "ws://localhost:2567"

export interface DebugEventBatch {
  events: GameEvent[]
  actionType: string
}

export class DebugClient {
  private client: Client
  private room: Room | null = null

  constructor() {
    this.client = new Client(SERVER_URL)
  }

  async connect(): Promise<void> {
    this.room = await this.client.joinOrCreate("debug_room")
  }

  dispatch(playerId: string, action: GameAction): void {
    this.room?.send("dispatch", { playerId, action })
  }

  loadState(state: GameState): void {
    this.room?.send("load_state", { state })
  }

  reset(): void {
    this.room?.send("reset", {})
  }

  injectCard(card: CardDefinition): void {
    this.room?.send("inject_card", { card })
  }

  onState(callback: (state: GameState) => void): void {
    this.room?.onMessage("DEBUG_STATE", callback)
  }

  onEvents(callback: (batch: DebugEventBatch) => void): void {
    this.room?.onMessage("DEBUG_EVENTS", callback)
  }

  onError(callback: (err: { error: string }) => void): void {
    this.room?.onMessage("DEBUG_ERROR", callback)
  }

  disconnect(): void {
    this.room?.leave()
    this.room = null
  }
}
