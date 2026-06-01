import { Room, Client } from "colyseus"
import { GameEngine, createInitialGameState } from "@tcg/game-engine"
import { registerCard } from "@tcg/card-data"
import type { CardDefinition, GameAction, GameState } from "@tcg/shared-types"

const DEBUG_P1 = "P1"
const DEBUG_P2 = "P2"
const DEBUG_ACE = "cyclone_sovereign"

const P1_DECK = [
  ...Array(5).fill("iron_sentinel"),
  ...Array(5).fill("ember_seer"),
  ...Array(4).fill("storm_channeler"),
  ...Array(4).fill("inferno_vanguard"),
  ...Array(3).fill("flame_vanguard"),
  ...Array(3).fill("shield_guardian"),
  ...Array(2).fill("quick_strike"),
  ...Array(2).fill("restoration"),
  ...Array(2).fill("silence_bolt"),
] as string[]

const P2_DECK = [
  ...Array(8).fill("iron_sentinel"),
  ...Array(8).fill("grave_sentinel"),
  ...Array(7).fill("flame_vanguard"),
  ...Array(7).fill("shield_guardian"),
] as string[]

export class DebugRoom extends Room {
  private engine: GameEngine | null = null

  override onCreate(): void {
    this.maxClients = 1
    this.autoDispose = true

    this.initializeGame(Date.now())

    this.onMessage("dispatch", (client: Client, data: { playerId: string; action: GameAction }) => {
      if (!this.engine) return
      const action = { ...data.action, playerId: data.playerId }
      const result = this.engine.dispatch(action)

      if (!result.success) {
        client.send("DEBUG_ERROR", { error: result.error })
        return
      }

      client.send("DEBUG_STATE", this.engine.getState())
      if (result.events && result.events.length > 0) {
        client.send("DEBUG_EVENTS", { events: result.events, actionType: data.action.type })
      }
    })

    this.onMessage("load_state", (client: Client, data: { state: GameState }) => {
      if (!this.engine) {
        this.engine = new GameEngine(data.state)
      } else {
        this.engine.loadState(data.state)
      }
      client.send("DEBUG_STATE", this.engine.getState())
    })

    this.onMessage("reset", (client: Client) => {
      this.initializeGame(Date.now())
      if (this.engine) client.send("DEBUG_STATE", this.engine.getState())
    })

    this.onMessage("inject_card", (client: Client, data: { card: CardDefinition }) => {
      registerCard(data.card)
      this.initializeGameWithCard(data.card.id, Date.now())
      if (this.engine) client.send("DEBUG_STATE", this.engine.getState())
    })
  }

  override onJoin(client: Client): void {
    if (this.engine) client.send("DEBUG_STATE", this.engine.getState())
  }

  private initializeGame(seed: number): void {
    const state = createInitialGameState(
      "debug",
      DEBUG_P1,
      DEBUG_P2,
      P1_DECK,
      P2_DECK,
      DEBUG_ACE,
      DEBUG_ACE,
      seed
    )
    this.engine = new GameEngine(state)
  }

  private initializeGameWithCard(cardId: string, seed: number): void {
    const testDeck = [
      ...Array(15).fill(cardId),
      ...Array(10).fill("iron_sentinel"),
      ...Array(5).fill("flame_vanguard"),
    ] as string[]
    const state = createInitialGameState(
      "debug",
      DEBUG_P1,
      DEBUG_P2,
      testDeck,
      P2_DECK,
      DEBUG_ACE,
      DEBUG_ACE,
      seed
    )
    this.engine = new GameEngine(state)
  }
}
