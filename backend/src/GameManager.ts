import { WebSocket } from "ws";
import { getActivePersistedGameForUser } from "./chessPersistenceClient";
import { Game } from "./Game";
import { INIT_GAME, INVALID_MOVE, MOVE } from "./messages";
import type { AuthenticatedSocket } from "./types/auth";

//todo user, class game class

export class GameManager {
  private gamesById: Map<string, Game>;
  private pendingUser: AuthenticatedSocket | null;
  private users: AuthenticatedSocket[];

  constructor() {
    this.gamesById = new Map();
    this.pendingUser = null;
    this.users = [];
  }

  addUser(socket: AuthenticatedSocket) {
    this.users.push(socket);
    this.addHandler(socket);
    void this.resumeUserGame(socket);
  }

  removerUser(socket: AuthenticatedSocket) {
    this.users = this.users.filter((user) => user != socket);

    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }

    const game = this.findAnyGameBySocket(socket);
    if (game) {
      game.detachPlayerSocket(socket);

      if (!game.isActive() && !game.hasConnectedPlayers()) {
        this.gamesById.delete(game.gameId);
      }
    }

    //stop the game here because user left
  }

  private sendInvalidMove(socket: AuthenticatedSocket, reason: string) {
    socket.send(
      JSON.stringify({
        type: INVALID_MOVE,
        payload: { message: reason },
      }),
    );
  }

  private findAnyGameBySocket(socket: WebSocket) {
    for (const game of this.gamesById.values()) {
      if (game.hasSocket(socket)) {
        return game;
      }
    }

    return null;
  }

  private findGameBySocket(socket: WebSocket) {
    for (const game of this.gamesById.values()) {
      if (game.isActive() && game.hasSocket(socket)) {
        return game;
      }
    }

    return null;
  }

  private hasInMemoryGameForUser(userId: string) {
    for (const game of this.gamesById.values()) {
      if (game.isActive() && game.hasUser(userId)) {
        return true;
      }
    }

    return false;
  }

  private async resumeUserGame(socket: AuthenticatedSocket) {
    try {
      const activeGame = await getActivePersistedGameForUser(socket.user.id);
      if (
        !activeGame ||
        !activeGame.whitePlayerId ||
        !activeGame.blackPlayerId
      ) {
        return;
      }

      let game = this.gamesById.get(activeGame.gameId);
      if (!game) {
        game = Game.fromPersisted(activeGame);
        this.gamesById.set(activeGame.gameId, game);
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
  }

  private addHandler(socket: AuthenticatedSocket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type == INIT_GAME) {
        const existingGame = this.findGameBySocket(socket);
        if (existingGame) {
          this.sendInvalidMove(socket, "You are already in an active match.");
          return;
        }

        if (this.hasInMemoryGameForUser(socket.user.id)) {
          this.sendInvalidMove(
            socket,
            "Reconnected to your active match. Continue from current board.",
          );
          return;
        }

        if (this.pendingUser) {
          if (this.pendingUser === socket) {
            this.sendInvalidMove(socket, "Already searching for an opponent.");
            return;
          }

          if (
            this.pendingUser.readyState !== WebSocket.OPEN ||
            this.pendingUser.user.id === socket.user.id
          ) {
            this.pendingUser = socket;
            return;
          }

          //start the game
          const waitingUser = this.pendingUser;
          this.pendingUser = null;

          void Game.create(waitingUser, socket)
            .then((game) => {
              this.gamesById.set(game.gameId, game);
            })
            .catch((error) => {
              console.error("Failed to create persisted chess game:", error);

              if (!this.pendingUser) {
                this.pendingUser = waitingUser;
              }

              const messageText =
                "Unable to start the match right now. Please try again.";

              if (this.pendingUser?.readyState === WebSocket.OPEN) {
                this.sendInvalidMove(this.pendingUser, messageText);
              }

              this.sendInvalidMove(socket, messageText);
            });
        } else {
          this.pendingUser = socket;
        }
      }

      if (message.type == MOVE) {
        const game = this.findGameBySocket(socket);

        if (game) {
          game.makeMove(socket, message.payload.move);
        } else {
          this.sendInvalidMove(
            socket,
            "No active game found for this connection. Reconnect to resume.",
          );
        }
      }
    });
  }
}
