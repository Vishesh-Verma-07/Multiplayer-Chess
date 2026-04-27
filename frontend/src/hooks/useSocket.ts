import { useEffect, useState } from "react";

const WS_URL = import.meta.env.VITE_WEBSOCKET_BACKEND_URL;
const RECONNECT_DELAY_MS = 1500;

export const useSocket = (token: string | null) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    let isActive = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let currentSocket: WebSocket | null = null;

    const connect = () => {
      if (!isActive) {
        return;
      }

      const url = new URL(WS_URL);
      url.searchParams.set("token", token);

      const ws = new WebSocket(url.toString());
      currentSocket = ws;

      ws.onopen = () => {
        if (!isActive) {
          ws.close();
          return;
        }

        setSocket(ws);
      };

      ws.onclose = () => {
        if (currentSocket === ws) {
          currentSocket = null;
        }

        setSocket((prev) => (prev === ws ? null : prev));

        if (!isActive) {
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
  }, [token]);

  return socket;
};
