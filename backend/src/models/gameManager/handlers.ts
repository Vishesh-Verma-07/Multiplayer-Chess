import { WebSocket } from "ws";
import { getActivePersistedGameForUser } from "../../db/chessPersistenceClient";
import type { AuthenticatedSocket } from "../../types/auth";
import {
  DRAW_REQUEST,
  DRAW_RESPONSE,
  INIT_GAME,
  INVALID_MOVE,
  MOVE,
  RESIGN,
} from "../../utils/messages";
import { Game } from "../Game";

export type GameManagerContext = {
  gamesById: Map<string, Game>;
  getPendingUser: () => AuthenticatedSocket | null;
  setPendingUser: (user: AuthenticatedSocket | null) => void;
  findGameBySocket: (socket: WebSocket) => Game | null;
  hasInMemoryGameForUser: (userId: string) => boolean;
  sendInvalidMove: (socket: AuthenticatedSocket, reason: string) => void;
};

export const resumeUserGame = async (
  context: GameManagerContext,
  socket: AuthenticatedSocket,
) => {
  try {
    const activeGame = await getActivePersistedGameForUser(socket.user.id);
    if (!activeGame || !activeGame.whitePlayerId || !activeGame.blackPlayerId) {
      return;
    }

    let game = context.gamesById.get(activeGame.gameId);
    if (!game) {
      game = Game.fromPersisted(activeGame);
      context.gamesById.set(activeGame.gameId, game);
    }

    game.attachPlayer(socket);

    const opponentSocket = game.getOpponentSocket(socket);
    if (
      opponentSocket &&
      opponentSocket.readyState === WebSocket.OPEN &&
      game.hasBothPlayersConnected()
    ) {
      opponentSocket.send(
        JSON.stringify({
          type: INVALID_MOVE,
          payload: {
            message: `${socket.user.username} reconnected. Match resumed.`,
          },
        }),
      );
    }
  } catch (error) {
    console.error("Failed to resume game for user:", error);
  }
};

export const handleSocketMessage = (
  context: GameManagerContext,
  socket: AuthenticatedSocket,
  rawData: string,
) => {
  const message = JSON.parse(rawData);

  if (message.type === INIT_GAME) {
    const existingGame = context.findGameBySocket(socket);
    if (existingGame) {
      context.sendInvalidMove(socket, "You are already in an active match.");
      return;
    }

    if (context.hasInMemoryGameForUser(socket.user.id)) {
      context.sendInvalidMove(
        socket,
        "Reconnected to your active match. Continue from current board.",
      );
      return;
    }

    const pendingUser = context.getPendingUser();
    if (pendingUser) {
      if (pendingUser === socket) {
        context.sendInvalidMove(socket, "Already searching for an opponent.");
        return;
      }

      if (
        pendingUser.readyState !== WebSocket.OPEN ||
        pendingUser.user.id === socket.user.id
      ) {
        context.setPendingUser(socket);
        return;
      }

      const waitingUser = pendingUser;
      context.setPendingUser(null);

      void Game.create(waitingUser, socket)
        .then((game) => {
          context.gamesById.set(game.gameId, game);
        })
        .catch((error) => {
          console.error("Failed to create persisted chess game:", error);

          if (!context.getPendingUser()) {
            context.setPendingUser(waitingUser);
          }

          const messageText =
            "Unable to start the match right now. Please try again.";

          const currentPending = context.getPendingUser();
          if (currentPending?.readyState === WebSocket.OPEN) {
            context.sendInvalidMove(currentPending, messageText);
          }

          context.sendInvalidMove(socket, messageText);
        });
      return;
    }

    context.setPendingUser(socket);
    return;
  }

  if (message.type === MOVE) {
    const game = context.findGameBySocket(socket);

    if (game) {
      game.makeMove(socket, message.payload.move);
    } else {
      context.sendInvalidMove(
        socket,
        "No active game found for this connection. Reconnect to resume.",
      );
    }
    return;
  }

  if (message.type === RESIGN) {
    const game = context.findGameBySocket(socket);

    if (game) {
      game.resign(socket);
    } else {
      context.sendInvalidMove(
        socket,
        "No active game found for this connection. Reconnect to resume.",
      );
    }
    return;
  }

  if (message.type === DRAW_REQUEST) {
    const game = context.findGameBySocket(socket);

    if (game) {
      game.requestDraw(socket);
    } else {
      context.sendInvalidMove(
        socket,
        "No active game found for this connection. Reconnect to resume.",
      );
    }
    return;
  }

  if (message.type === DRAW_RESPONSE) {
    const game = context.findGameBySocket(socket);

    if (game) {
      game.respondDraw(socket, Boolean(message.payload?.accepted));
    } else {
      context.sendInvalidMove(
        socket,
        "No active game found for this connection. Reconnect to resume.",
      );
    }
  }
};
