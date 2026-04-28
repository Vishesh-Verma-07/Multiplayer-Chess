import { Chess } from "chess.js";
import { WebSocket } from "ws";
import {
  createPersistedGame,
  finishPersistedGame,
  saveBoardSnapshot,
} from "./chessPersistenceClient";
import { GAME_OVER, INIT_GAME, INVALID_MOVE, MOVE } from "./messages";
import type { AuthenticatedSocket } from "./types/auth";
import type { PersistedMove } from "./types/game";
import type { ActivePersistedGame } from "./types/persistence";

export class Game {
  public player1: WebSocket | null;
  public player2: WebSocket | null;
  private board: Chess;
  private startTime: Date;
  public readonly gameId: string;
  private readonly whitePlayerId: string;
  private readonly blackPlayerId: string;
  private moves: number;
  private finished: boolean;

  //make the players as types

  private constructor({
    player1,
    player2,
    gameId,
    whitePlayerId,
    blackPlayerId,
    fen,
    moves,
  }: {
    player1: WebSocket | null;
    player2: WebSocket | null;
    gameId: string;
    whitePlayerId: string;
    blackPlayerId: string;
    fen?: string;
    moves?: number;
  }) {
    ((this.player1 = player1), (this.player2 = player2));
    this.board = new Chess();
    if (fen) {
      this.board.load(fen);
    }
    this.startTime = new Date();
    this.gameId = gameId;
    this.whitePlayerId = whitePlayerId;
    this.blackPlayerId = blackPlayerId;
    this.moves = moves ?? 0;
    this.finished = false;
  }

  private sendInit(
    socket: WebSocket,
    color: "white" | "black",
    resumed: boolean,
  ) {
    socket.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color,
          gameId: this.gameId,
          fen: this.board.fen(),
          resumed,
        },
      }),
    );
  }

  static fromPersisted(activeGame: ActivePersistedGame) {
    if (!activeGame.whitePlayerId || !activeGame.blackPlayerId) {
      throw new Error("Active game is missing player IDs.");
    }

    return new Game({
      player1: null,
      player2: null,
      gameId: activeGame.gameId,
      whitePlayerId: activeGame.whitePlayerId,
      blackPlayerId: activeGame.blackPlayerId,
      fen: activeGame.currentFen,
      moves: activeGame.movesCount,
    });
  }

  hasUser(userId: string) {
    return userId === this.whitePlayerId || userId === this.blackPlayerId;
  }

  hasSocket(socket: WebSocket) {
    return this.player1 === socket || this.player2 === socket;
  }

  isActive() {
    return !this.finished;
  }

  hasConnectedPlayers() {
    return Boolean(this.player1 || this.player2);
  }

  hasBothPlayersConnected() {
    return Boolean(this.player1 && this.player2);
  }

  attachPlayer(socket: AuthenticatedSocket) {
    if (socket.user.id === this.whitePlayerId) {
      this.player1 = socket;
      this.sendInit(socket, "white", true);
      return;
    }

    if (socket.user.id === this.blackPlayerId) {
      this.player2 = socket;
      this.sendInit(socket, "black", true);
      return;
    }

    throw new Error("User is not part of this game.");
  }

  detachPlayerSocket(socket: WebSocket) {
    if (this.player1 === socket) {
      this.player1 = null;
    }

    if (this.player2 === socket) {
      this.player2 = null;
    }
  }

  getOpponentSocket(socket: WebSocket) {
    if (this.player1 === socket) {
      return this.player2;
    }

    if (this.player2 === socket) {
      return this.player1;
    }

    return null;
  }

  private getPlayerColor(socket: WebSocket): "white" | "black" | null {
    if (socket === this.player1) {
      return "white";
    }
    if (socket === this.player2) {
      return "black";
    }
    return null;
  }

  static async create(
    player1: AuthenticatedSocket,
    player2: AuthenticatedSocket,
  ) {
    const game = await createPersistedGame({
      whitePlayerId: player1.user.id,
      blackPlayerId: player2.user.id,
      initialFen: new Chess().fen(),
    });

    const instance = new Game({
      player1,
      player2,
      gameId: game.id,
      whitePlayerId: player1.user.id,
      blackPlayerId: player2.user.id,
      fen: new Chess().fen(),
      moves: 0,
    });

    instance.sendInit(player1, "white", false);
    instance.sendInit(player2, "black", false);
    await instance.persistSnapshot();

    return instance;
  }

  private async persistSnapshot() {
    await saveBoardSnapshot({
      gameId: this.gameId,
      fen: this.board.fen(),
      moveNumber: this.moves,
      sideToMove: this.board.turn(),
      boardState: this.board.board(),
    });
  }

  private async persistFinishedGame() {
    const result = this.board.isDraw()
      ? "DRAW"
      : this.board.turn() === "w"
        ? "BLACK_WIN"
        : "WHITE_WIN";

    const winnerId = this.board.isDraw()
      ? undefined
      : result === "WHITE_WIN"
        ? this.whitePlayerId
        : this.blackPlayerId;

    await finishPersistedGame({
      gameId: this.gameId,
      result,
      winnerId,
      pgn: this.board.pgn(),
      finalFen: this.board.fen(),
    });
  }

  private broadcast(type: string, payload: unknown) {
    const message = JSON.stringify({ type, payload });

    if (this.player1 && this.player1.readyState === WebSocket.OPEN) {
      this.player1.send(message);
    }

    if (this.player2 && this.player2.readyState === WebSocket.OPEN) {
      this.player2.send(message);
    }
  }

  private sendInvalidMove(socket: WebSocket, reason: string) {
    socket.send(
      JSON.stringify({
        type: INVALID_MOVE,
        payload: {
          message: reason,
        },
      }),
    );
  }

  makeMove(socket: WebSocket, move: PersistedMove) {
    //validate the type of move uisng zod
    // validation here
    // is it this users move
    // is the move valid

    const playerColor = this.getPlayerColor(socket);
    if (!playerColor) {
      this.sendInvalidMove(socket, "You are not part of this match.");
      return;
    }

    const expectedColor = this.board.turn() === "w" ? "white" : "black";
    if (playerColor !== expectedColor) {
      this.sendInvalidMove(socket, "It is not your turn.");
      return;
    }

    if (!move || typeof move.from !== "string" || typeof move.to !== "string") {
      this.sendInvalidMove(socket, "Invalid move payload.");
      return;
    }

    try {
      const result = this.board.move(move);
      if (!result) {
        this.sendInvalidMove(socket, "Illegal move. Try a different move.");
        return;
      }
    } catch (error) {
      this.sendInvalidMove(socket, "Illegal move. Try a different move.");
      return;
    }

    this.moves += 1;

    void this.persistSnapshot().catch((error) => {
      console.error("Failed to persist chess board snapshot:", error);
    });

    if (this.board.isGameOver()) {
      this.finished = true;

      void this.persistFinishedGame().catch((error) => {
        console.error("Failed to finalize chess game:", error);
      });

      this.broadcast(GAME_OVER, {
        winner: this.board.isDraw()
          ? null
          : this.board.turn() === "w"
            ? "black"
            : "white",
      });
      return;
    }

    this.broadcast(MOVE, {
      move,
    });

    //send the updated board to both plyaer
  }
}
