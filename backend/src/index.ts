import "dotenv/config";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { verifyAuthToken } from "./auth";
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
  const socket = ws as Parameters<GameManager["addUser"]>[0];

  if (!socket.user) {
    ws.close(1008, "Authentication required");
    return;
  }

  gameManager.addUser(socket);

  ws.on("close", () => gameManager.removerUser(socket));
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
  const parsedUrl = new URL(req.url ?? "/", `http://${host}`);
  const { pathname } = parsedUrl;

  if (pathname === "/ws/alive") {
    aliveWss.handleUpgrade(req, socket, head, (ws) => {
      aliveWss.emit("connection", ws, req);
    });
    return;
  }

  if (pathname === "/" || pathname === "/ws" || pathname === "/ws/game") {
    const token = parsedUrl.searchParams.get("token");
    if (!token) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n",
      );
      socket.destroy();
      return;
    }

    const authUser = verifyAuthToken(token);
    if (!authUser) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n",
      );
      socket.destroy();
      return;
    }

    gameWss.handleUpgrade(req, socket, head, (ws) => {
      (ws as Parameters<GameManager["addUser"]>[0]).user = authUser;
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
