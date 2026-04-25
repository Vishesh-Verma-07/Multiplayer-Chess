import { useEffect, useState } from "react";

const WS_URL = import.meta.env.VITE_WEBSOCKET_BACKEND_URL;

export const useSocket = (token: string | null) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    console.log("trying to connect to the url", WS_URL);
    const url = new URL(WS_URL);
    url.searchParams.set("token", token);

    const ws = new WebSocket(url.toString());
    console.log("socket created is ", ws);

    ws.onopen = () => {
      setSocket(ws);
    };

    ws.onclose = () => {
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  return socket;
};
