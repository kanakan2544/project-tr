import type { GameState, GameEvent } from "@tcg/shared-types"
import { TriggerType } from "@tcg/shared-types"
import { deepCloneState, getPlayer } from "../utils/state-helpers"
import { seededShuffle } from "../utils/seeded-shuffle"
import { checkWinConditions } from "../core/win-condition-checker"
import { evaluateBattlefieldPrimed } from "../systems/primed-system"
import { resolveTriggers } from "../effects/effect-trigger-system"

export function drawCards(
  state: GameState,
  playerId: string,
  count: number
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []
  let drawn = 0

  for (let i = 0; i < count; i++) {
    const player = getPlayer(current, playerId)

    // Draw from deck
    if (player.deck.length > 0) {
      const card = player.deck.shift()!
      player.hand.push(card)
      drawn++
      continue
    }

    // Deck empty — check revolve pile
    if (player.revolvePile.length > 0) {
      const seed = hashSeed(current.matchId) ^ (current.turn * 31) ^ (player.revolveCount * 17)
      const shuffled = seededShuffle(player.revolvePile, seed)
      player.revolvePile = []
      player.deck = shuffled
      player.revolveCount++

      events.push({ type: "REVOLVE_TRIGGERED", playerId, revolveCount: player.revolveCount })

      if (player.revolveCount === 1) {
        events.push({ type: "ACE_UNLOCKED", playerId })
      }

      // Evaluate primed on revolve for battlefield units
      const primedResult = evaluateBattlefieldPrimed(current, playerId, TriggerType.ON_REVOLVE)
      current = primedResult.nextState
      events.push(...primedResult.events)

      // Fire ON_REVOLVE triggers
      const revolveResult = resolveTriggers(current, TriggerType.ON_REVOLVE, null, playerId)
      current = revolveResult.nextState
      events.push(...revolveResult.events)

      // Draw the card we just unlocked
      const freshPlayer = getPlayer(current, playerId)
      const card = freshPlayer.deck.shift()!
      freshPlayer.hand.push(card)
      drawn++
      continue
    }

    // Both empty — fatigue
    const player2 = getPlayer(current, playerId)
    player2.life -= 1
    events.push({ type: "FATIGUE_DAMAGE", playerId, damage: 1 })
    current = checkWinConditions(current)

    if (current.winner !== null || current.isDraw) {
      events.push({ type: "GAME_OVER", winner: current.winner, isDraw: current.isDraw })
      break
    }
  }

  if (drawn > 0) {
    events.push({ type: "CARDS_DRAWN", playerId, count: drawn })
  }

  return { nextState: current, events }
}

function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return h >>> 0
}
