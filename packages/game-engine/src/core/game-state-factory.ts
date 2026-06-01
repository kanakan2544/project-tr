import type { GameState, PlayerState, LaneState, CardInstance } from "@tcg/shared-types"
import { Phase } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { generateInstanceId, resetIdCounter } from "../utils/id-generator"
import { seededShuffle } from "../utils/seeded-shuffle"

const LANE_COUNT = 5
const STARTING_LIFE = 25
const STARTING_HAND_SIZE = 5

function createCardInstances(cardIds: string[], owner: string): CardInstance[] {
  return cardIds.map((cardId) => ({
    instanceId: generateInstanceId(cardId),
    cardId,
    owner,
    primedInfuseCount: 0,
    infuseValueBonus: 0,
  }))
}

function createBattlefield(): LaneState[] {
  return Array.from({ length: LANE_COUNT }, (_, i) => ({
    index: i,
    unit: null,
  }))
}

function createPlayerState(
  id: string,
  deckCardIds: string[],
  aceCardId: string,
  seed: number
): PlayerState {
  if (deckCardIds.length !== 30) {
    throw new Error(`Deck must contain exactly 30 cards, got ${deckCardIds.length}`)
  }

  // Validate all card IDs exist
  for (const cardId of deckCardIds) {
    getCard(cardId)
  }
  getCard(aceCardId)

  const deckInstances = createCardInstances(deckCardIds, id)
  const shuffled = seededShuffle(deckInstances, seed)
  const aceInstance: CardInstance = {
    instanceId: generateInstanceId(aceCardId),
    cardId: aceCardId,
    owner: id,
    primedInfuseCount: 0,
    infuseValueBonus: 0,
  }

  return {
    id,
    life: STARTING_LIFE,
    deck: shuffled,
    hand: [],
    revolvePile: [],
    discardPile: [],
    battlefield: createBattlefield(),
    ace: aceInstance,
    revolveCount: 0,
    temporaryResources: 0,
  }
}

function drawInitialHand(player: PlayerState, count: number): void {
  for (let i = 0; i < count && player.deck.length > 0; i++) {
    const card = player.deck.shift()!
    player.hand.push(card)
  }
}

export function createInitialGameState(
  matchId: string,
  player1Id: string,
  player2Id: string,
  player1DeckCardIds: string[],
  player2DeckCardIds: string[],
  player1AceCardId: string,
  player2AceCardId: string,
  shuffleSeed: number
): GameState {
  resetIdCounter()

  const p1Seed = shuffleSeed
  const p2Seed = shuffleSeed ^ 0x5a5a5a5a

  const p1 = createPlayerState(player1Id, player1DeckCardIds, player1AceCardId, p1Seed)
  const p2 = createPlayerState(player2Id, player2DeckCardIds, player2AceCardId, p2Seed)

  // Draw initial hands: p1 gets 5, p2 gets 6 (bonus card)
  drawInitialHand(p1, STARTING_HAND_SIZE)
  drawInitialHand(p2, STARTING_HAND_SIZE + 1)

  return {
    matchId,
    turn: 1,
    activePlayer: player1Id,
    phase: Phase.START_TURN,
    players: {
      [player1Id]: p1,
      [player2Id]: p2,
    },
    effectQueue: [],
    winner: null,
    isDraw: false,
    actionLog: [],
    shuffleSeed,
  }
}
