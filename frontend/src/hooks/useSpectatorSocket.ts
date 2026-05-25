import { useEffect, useState } from "react";

const WS_URL = import.meta.env.VITE_WEBSOCKET_BACKEND_URL;
const RECONNECT_DELAY_MS = 1500;

const buildSpectatorUrl = (gameId: string) => {
  const url = new URL(WS_URL);
  if (url.pathname.endsWith("/api/ws")) {
    url.pathname = url.pathname.replace(/\/api\/ws\/?$/, "/api/ws/spectate");
  } else {
    url.pathname = "/api/ws/spectate";
  }
  url.searchParams.set("gameId", gameId);
  return url.toString();
};

export const useSpectatorSocket = (gameId: string | null) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!gameId) {
      setSocket(null);
      return;
    }

    let isActive = true;
    let shouldReconnect = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let currentSocket: WebSocket | null = null;

    const connect = () => {
      if (!isActive) {
        return;
      }

      const ws = new WebSocket(buildSpectatorUrl(gameId));
      currentSocket = ws;

      ws.onopen = () => {
        if (!isActive) {
          ws.close();
          return;
        }

        setSocket(ws);
      };

      ws.onclose = (event) => {
        if (currentSocket === ws) {
          currentSocket = null;
        }

        setSocket((prev) => (prev === ws ? null : prev));

        if (event.code === 1008) {
          shouldReconnect = false;
        }

        if (!isActive || !shouldReconnect) {
          return;
        }

        reconnectTimer = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isActive = false;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (currentSocket) {
        currentSocket.close();
      }

      setSocket(null);
    };
  }, [gameId]);

  return socket;
};
