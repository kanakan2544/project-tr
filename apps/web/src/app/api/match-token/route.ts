import { NextResponse } from "next/server"
import { prisma } from "@tcg/db"
import { auth } from "@/auth"
import { signMatchToken } from "@/lib/match-token"

// POST /api/match-token { deckId } — verify deck ownership, return a short-lived
// token the Colyseus server trusts to load the authoritative deck.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { deckId } = (await req.json()) as { deckId?: string }
  if (!deckId) return NextResponse.json({ error: "deckId is required" }, { status: 400 })

  const deck = await prisma.deck.findUnique({ where: { id: deckId } })
  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 })
  }

  const token = await signMatchToken({ userId: session.user.id, deckId })
  return NextResponse.json({ token })
}
