import type { Chess, Color, PieceSymbol, Square } from "chess.js";
import type { Dispatch, SetStateAction } from "react";

export type ChessBoardSquare = {
  square: Square;
  type: PieceSymbol;
  color: Color;
};

export type ChessBoardState = (ChessBoardSquare | null)[][];

export type ChessBoardProps = {
  setBoard: Dispatch<SetStateAction<ChessBoardState>>;
  chess: Chess;
  board: ChessBoardState;
  socket: WebSocket;
  canMove: boolean;
  onIllegalMove: (message: string) => void;
  orientation?: "white" | "black";
  onMoveExecuted?: () => void;
};
