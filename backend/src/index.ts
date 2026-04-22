import { createServer } from "http";
import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";

const PORT = 8080;

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "chess-backend",
        uptime: process.uptime(),
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const wss = new WebSocketServer({ server });

const gameManager = new GameManager();

wss.on("connection", function connection(ws) {
  gameManager.addUser(ws);

  ws.on("close", () => gameManager.removerUser(ws));
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
