import { useEffect, useState } from "react"


const WS_URL = import.meta.env.ENV == "production" ? import.meta.env.VITE_WS_URL : "ws://localhost:8080/ws";

export const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        console.log("trying to connect to the url");
        const ws = new WebSocket(WS_URL);
        console.log("socket created is ", ws)

        ws.onopen = () => {
            setSocket(ws);
        }

        ws.onclose = () => {
            setSocket(null);
        }

        return () => {
            ws.close();
        }
    }, [])


    return socket;
}