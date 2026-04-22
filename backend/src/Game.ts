import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { GAME_OVER, INIT_GAME, INVALID_MOVE, MOVE } from "./messages";

export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private startTime: Date;
  private moves = 0;

  //make the players as types

  constructor(player1: WebSocket, player2: WebSocket) {
    ((this.player1 = player1), (this.player2 = player2));
    this.board = new Chess();
    this.startTime = new Date();

    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "white",
        },
      }),
    );
    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "black",
        },
      }),
    );
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

  makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    },
  ) {
    //validate the type of move uisng zod
    // validation here
    // is it this users move
    // is the move valid

    if (this.moves % 2 === 0 && socket !== this.player1) {
      this.sendInvalidMove(socket, "It is not your turn.");
      return;
    }
    if (this.moves % 2 === 1 && socket !== this.player2) {
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

    if (this.board.isGameOver()) {
      this.player1.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.board.turn() === "w" ? "black" : "white",
          },
        }),
      );
      this.player2.send(
        JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner: this.board.turn() === "w" ? "black" : "white",
          },
        }),
      );
      return;
    }

    this.player1.send(
      JSON.stringify({
        type: MOVE,
        payload: move,
      }),
    );
    this.player2.send(
      JSON.stringify({
        type: MOVE,
        payload: move,
      }),
    );
    this.moves++;

    //send the updated board to both plyaer
  }
}
