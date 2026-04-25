import { WebSocket } from "ws";
import { AuthenticatedUser } from "./auth";
import { Game } from "./Game";
import { INIT_GAME, MOVE } from "./messages";

//todo user, class game class

export type AuthenticatedSocket = WebSocket & {
  user: AuthenticatedUser;
};

export class GameManager {
  private games: Game[];
  private pendingUser: AuthenticatedSocket | null;
  private users: AuthenticatedSocket[];

  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.users = [];
  }

  addUser(socket: AuthenticatedSocket) {
    this.users.push(socket);
    this.addHandler(socket);
  }

  removerUser(socket: AuthenticatedSocket) {
    this.users = this.users.filter((user) => user != socket);

    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }

    //stop the game here because user left
  }

  private addHandler(socket: AuthenticatedSocket) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type == INIT_GAME) {
        if (this.pendingUser) {
          //start the game
          const game = new Game(this.pendingUser, socket);
          this.games.push(game);
          this.pendingUser = null;
        } else {
          this.pendingUser = socket;
        }
      }

      if (message.type == MOVE) {
        const game = this.games.find(
          (game) => game.player1 == socket || game.player2 == socket,
        );

        if (game) {
          game.makeMove(socket, message.payload.move);
        }
      }
    });
  }
}
