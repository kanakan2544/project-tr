import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

// Edge middleware gates protected routes; unauthenticated users are redirected
// to the signIn page (/login) by the `authorized` callback.
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: ["/", "/collection/:path*", "/decks/:path*", "/game/:path*"],
}
