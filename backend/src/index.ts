import "dotenv/config";
import { createServer } from "http";
import { GameManager } from "./models/GameManager";
import { handleHttpRequest } from "./routes/httpRoutes";
import { registerWebSocketRoutes } from "./routes/wsRoutes";

const PORT = process.env.PORT || 8080;

const server = createServer(handleHttpRequest);

const gameManager = new GameManager();

registerWebSocketRoutes(server, { port: Number(PORT), gameManager });

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Game WS endpoint: ws://localhost:${PORT}/api/ws`);
  console.log(`Alive WS endpoint: ws://localhost:${PORT}/api/ws/alive`);
});
