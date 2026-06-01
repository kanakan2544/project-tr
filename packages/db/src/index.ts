import { PrismaClient } from "@prisma/client"

// Singleton PrismaClient. Cached on globalThis so Next.js HMR / dev reloads
// don't spawn a new connection pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma
}

export * from "@prisma/client"
