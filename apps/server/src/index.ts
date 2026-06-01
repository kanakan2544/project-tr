import { resolve } from "path"
import { config as loadEnv } from "dotenv"
// Load monorepo root .env (dev). No-op if the file is absent (production).
loadEnv({ path: resolve(__dirname, "../../../.env") })

import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "colyseus"
import { monitor } from "@colyseus/monitor"
import { GameRoom } from "./rooms/GameRoom"
import { DebugRoom } from "./rooms/DebugRoom"

const PORT = parseInt(process.env["PORT"] ?? "2567", 10)

const app = express()
app.use(cors())
app.use(express.json())

app.use("/colyseus", monitor())

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

const httpServer = createServer(app)

const gameServer = new Server({ server: httpServer })

gameServer.define("game_room", GameRoom).filterBy(["matchKey"])
gameServer.define("debug_room", DebugRoom)

gameServer.listen(PORT).then(() => {
  console.log(`[TCG Server] Listening on ws://localhost:${PORT}`)
  console.log(`[TCG Server] Monitor at http://localhost:${PORT}/colyseus`)
})
