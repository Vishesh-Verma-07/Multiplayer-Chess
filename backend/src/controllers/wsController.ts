import { WebSocket, WebSocketServer } from "ws";
import type { GameManager } from "../models/GameManager";

export const registerGameConnectionHandlers = (
  wss: WebSocketServer,
  gameManager: GameManager,
) => {
  wss.on("connection", (ws) => {
    const socket = ws as Parameters<GameManager["addUser"]>[0];

    if (!socket.user) {
      ws.close(1008, "Authentication required");
      return;
    }

    gameManager.addUser(socket);

    ws.on("close", () => gameManager.removerUser(socket));
  });
};

export const registerSpectatorConnectionHandlers = (
  wss: WebSocketServer,
  gameManager: GameManager,
) => {
  wss.on("connection", (ws, req) => {
    const host = req.headers.host ?? "localhost";
    const parsedUrl = new URL(req.url ?? "/", `http://${host}`);
    const gameId = parsedUrl.searchParams.get("gameId");

    if (!gameId) {
      ws.close(1008, "gameId is required.");
      return;
    }

    void gameManager.addSpectator(ws, gameId);

    ws.on("close", () => gameManager.removeSpectator(ws));
  });
};

export const registerAliveConnectionHandlers = (wss: WebSocketServer) => {
  wss.on("connection", (ws) => {
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
};
