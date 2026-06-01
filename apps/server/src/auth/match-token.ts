import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env["AUTH_SECRET"] ?? "")

export interface MatchTokenClaims {
  userId: string
  deckId: string
}

/**
 * Verify the HS256 match token minted by the web app (/api/match-token) using
 * the shared AUTH_SECRET. Throws if the token is invalid/expired.
 */
export async function verifyMatchToken(token: string): Promise<MatchTokenClaims> {
  const { payload } = await jwtVerify(token, secret)
  const userId = payload["userId"]
  const deckId = payload["deckId"]
  if (typeof userId !== "string" || typeof deckId !== "string") {
    throw new Error("Malformed match token")
  }
  return { userId, deckId }
}
