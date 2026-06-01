import { NextResponse } from "next/server"
import { prisma } from "@tcg/db"
import { validateDeck } from "@tcg/card-data"
import type { DeckInput, SavedDeckDTO } from "@tcg/shared-types"
import { auth } from "@/auth"

function toDTO(deck: { id: string; name: string; aceCardId: string; cardIds: string[] }): SavedDeckDTO {
  return { id: deck.id, name: deck.name, aceCardId: deck.aceCardId, cardIds: deck.cardIds }
}

type Ctx = { params: { id: string } }

// GET /api/decks/[id]
export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const deck = await prisma.deck.findUnique({ where: { id: params.id } })
  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(toDTO(deck))
}

// PUT /api/decks/[id] — update + re-validate.
export async function PUT(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.deck.findUnique({ where: { id: params.id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = (await req.json()) as DeckInput
  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: "Deck name is required" }, { status: 400 })

  const result = validateDeck(body.cardIds ?? [], body.aceCardId ?? "")
  if (!result.valid) return NextResponse.json({ error: "Invalid deck", details: result.errors }, { status: 400 })

  const deck = await prisma.deck.update({
    where: { id: params.id },
    data: { name, aceCardId: body.aceCardId, cardIds: [...body.cardIds] },
  })
  return NextResponse.json(toDTO(deck))
}

// DELETE /api/decks/[id]
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.deck.findUnique({ where: { id: params.id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.deck.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
