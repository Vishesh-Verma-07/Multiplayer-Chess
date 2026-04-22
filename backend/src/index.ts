import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
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

const gameWss = new WebSocketServer({ noServer: true });
const aliveWss = new WebSocketServer({ noServer: true });

const gameManager = new GameManager();

gameWss.on("connection", function connection(ws) {
  gameManager.addUser(ws);

  ws.on("close", () => gameManager.removerUser(ws));
});

aliveWss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "alive",
      message: "I am alive",
      timestamp: new Date().toISOString(),
    }),
  );

  const heartbeatInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(
      JSON.stringify({
        type: "alive",
        message: "I am alive",
        timestamp: new Date().toISOString(),
      }),
    );
  }, 5000);

  ws.on("close", () => {
    clearInterval(heartbeatInterval);
  });
});

server.on("upgrade", (req, socket, head) => {
  const host = req.headers.host ?? `localhost:${PORT}`;
  const { pathname } = new URL(req.url ?? "/", `http://${host}`);

  if (pathname === "/ws/alive") {
    aliveWss.handleUpgrade(req, socket, head, (ws) => {
      aliveWss.emit("connection", ws, req);
    });
    return;
  }

  if (pathname === "/" || pathname === "/ws" || pathname === "/ws/game") {
    gameWss.handleUpgrade(req, socket, head, (ws) => {
      gameWss.emit("connection", ws, req);
    });
    return;
  }

  socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
  socket.destroy();
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Game WS endpoint: ws://localhost:${PORT}/ws`);
  console.log(`Alive WS endpoint: ws://localhost:${PORT}/ws/alive`);
});
