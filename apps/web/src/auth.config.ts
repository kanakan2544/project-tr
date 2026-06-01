import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

/**
 * Edge-safe NextAuth config (no DB adapter). Shared by middleware (edge runtime)
 * and the full server-side config in auth.ts.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    // Used by middleware to gate matched routes.
    authorized({ auth }) {
      return Boolean(auth?.user)
    },
    jwt({ token, user }) {
      if (user) token.uid = user.id
      return token
    },
    session({ session, token }) {
      if (typeof token.uid === "string") session.user.id = token.uid
      return session
    },
  },
} satisfies NextAuthConfig
