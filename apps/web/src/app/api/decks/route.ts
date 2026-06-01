import { NextResponse } from "next/server"
import { prisma } from "@tcg/db"
import { validateDeck } from "@tcg/card-data"
import type { DeckInput, SavedDeckDTO } from "@tcg/shared-types"
import { auth } from "@/auth"

function toDTO(deck: { id: string; name: string; aceCardId: string; cardIds: string[] }): SavedDeckDTO {
  return { id: deck.id, name: deck.name, aceCardId: deck.aceCardId, cardIds: deck.cardIds }
}

// GET /api/decks — list the current user's decks.
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(decks.map(toDTO))
}

// POST /api/decks — create a deck (validated server-side before insert).
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json()) as DeckInput
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: "Deck name is required" }, { status: 400 })

  const result = validateDeck(body.cardIds ?? [], body.aceCardId ?? "")
  if (!result.valid) return NextResponse.json({ error: "Invalid deck", details: result.errors }, { status: 400 })

  const deck = await prisma.deck.create({
    data: {
      userId: session.user.id,
      name,
      aceCardId: body.aceCardId,
      cardIds: [...body.cardIds],
    },
  })
  return NextResponse.json(toDTO(deck), { status: 201 })
}
