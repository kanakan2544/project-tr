FROM node:20-slim

# Install OpenSSL for Prisma query engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable pnpm

WORKDIR /app

# Copy monorepo manifests first (better layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/card-data/package.json ./packages/card-data/
COPY packages/game-engine/package.json ./packages/game-engine/
COPY packages/bot-framework/package.json ./packages/bot-framework/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

# Copy full source (after install so node_modules layer is cached)
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Build: prisma generate + esbuild bundle → apps/server/dist/index.js
RUN pnpm --filter @tcg/server build

EXPOSE 2567

CMD ["node", "apps/server/dist/index.js"]
