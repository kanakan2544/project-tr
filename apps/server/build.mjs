import { build } from "esbuild"

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/index.js",
  external: [
    // Colyseus and its deps (use native WebSocket, etc.)
    "colyseus",
    "@colyseus/monitor",
    "@colyseus/schema",
    "@colyseus/core",
    // Express / HTTP
    "express",
    "cors",
    // Prisma — must resolve its own query engine binaries at runtime
    "@prisma/client",
    ".prisma",
    // Auth / JWT
    "dotenv",
    "jose",
    // Optional native WebSocket modules (may not be installed)
    "bufferutil",
    "utf-8-validate",
  ],
})

console.log("Build complete: dist/index.js")
