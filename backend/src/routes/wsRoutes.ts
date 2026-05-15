import type { Server } from "http";
import { WebSocketServer } from "ws";
import {
  registerAliveConnectionHandlers,
  registerGameConnectionHandlers,
} from "../controllers/wsController";
import { verifyAuthToken } from "../middleware/auth";
import type { GameManager } from "../models/GameManager";

type WsRouteOptions = {
  port: number;
  gameManager: GameManager;
};

export const registerWebSocketRoutes = (
  server: Server,
  { port, gameManager }: WsRouteOptions,
) => {
  const gameWss = new WebSocketServer({ noServer: true });
  const aliveWss = new WebSocketServer({ noServer: true });

  registerGameConnectionHandlers(gameWss, gameManager);
  registerAliveConnectionHandlers(aliveWss);

  server.on("upgrade", (req, socket, head) => {
    const host = req.headers.host ?? `localhost:${port}`;
    const parsedUrl = new URL(req.url ?? "/", `http://${host}`);
    const { pathname } = parsedUrl;

    if (pathname === "/api/ws/alive") {
      aliveWss.handleUpgrade(req, socket, head, (ws) => {
        aliveWss.emit("connection", ws, req);
      });
      return;
    }

    if (pathname === "/api/ws" || pathname === "/api/ws/game") {
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

  return { gameWss, aliveWss };
};
