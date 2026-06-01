import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@tcg/db"
import { authConfig } from "./auth.config"
import { INVINCIBLE_STARTER_DECK } from "@tcg/card-data"

// Full config (Node runtime): adds the Prisma adapter for user persistence.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  events: {
    async createUser({ user }) {
      if (!user.id) return
      await prisma.deck.create({
        data: {
          userId: user.id,
          name: INVINCIBLE_STARTER_DECK.name,
          aceCardId: INVINCIBLE_STARTER_DECK.aceCardId,
          cardIds: [...INVINCIBLE_STARTER_DECK.cardIds],
        },
      })
    },
  },
})
