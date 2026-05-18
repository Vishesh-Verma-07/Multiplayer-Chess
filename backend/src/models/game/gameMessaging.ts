import { WebSocket } from "ws";
import { INIT_GAME, INVALID_MOVE } from "../../utils/messages";

type InitPayload = {
  color: "white" | "black";
  gameId: string;
  fen: string;
  resumed: boolean;
};

export const sendInit = (socket: WebSocket, payload: InitPayload) => {
  socket.send(
    JSON.stringify({
      type: INIT_GAME,
      payload,
    }),
  );
};

export const sendInvalidMove = (socket: WebSocket, reason: string) => {
  socket.send(
    JSON.stringify({
      type: INVALID_MOVE,
      payload: {
        message: reason,
      },
    }),
  );
};

export const broadcastToPlayers = (
  player1: WebSocket | null,
  player2: WebSocket | null,
  type: string,
  payload: unknown,
) => {
  const message = JSON.stringify({ type, payload });

  if (player1 && player1.readyState === WebSocket.OPEN) {
    player1.send(message);
  }

  if (player2 && player2.readyState === WebSocket.OPEN) {
    player2.send(message);
  }
};
