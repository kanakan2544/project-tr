import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env["AUTH_SECRET"] ?? "")

export interface MatchTokenClaims {
  userId: string
  deckId: string
}

/**
 * Mint a short-lived HS256 token binding a user to a chosen deck. The Colyseus
 * server verifies this with the shared AUTH_SECRET, then loads the authoritative
 * deck from the DB — the client never dictates the card list.
 */
export async function signMatchToken(claims: MatchTokenClaims): Promise<string> {
  return new SignJWT({ userId: claims.userId, deckId: claims.deckId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret)
}
