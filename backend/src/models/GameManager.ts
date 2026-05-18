import { WebSocket } from "ws";
import type { AuthenticatedSocket } from "../types/auth";
import { INVALID_MOVE } from "../utils/messages";
import { Game } from "./Game";
import { handleSocketMessage, resumeUserGame } from "./gameManager/handlers";

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
    void resumeUserGame(this.getContext(), socket);
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

  private addHandler(socket: AuthenticatedSocket) {
    socket.on("message", (data) => {
      handleSocketMessage(this.getContext(), socket, data.toString());
    });
  }

  private getContext() {
    return {
      gamesById: this.gamesById,
      getPendingUser: () => this.pendingUser,
      setPendingUser: (user: AuthenticatedSocket | null) => {
        this.pendingUser = user;
      },
      findGameBySocket: (socket: WebSocket) => this.findGameBySocket(socket),
      hasInMemoryGameForUser: (userId: string) =>
        this.hasInMemoryGameForUser(userId),
      sendInvalidMove: (socket: AuthenticatedSocket, reason: string) =>
        this.sendInvalidMove(socket, reason),
    };
  }
}
