import { PieceSymbol } from "chess.js";

export type PlayerColor = "white" | "black";

export type GameNotification = {
  message: string;
  tone: "critical" | "warning";
} | null;

export type MoveRow = {
  turn: number;
  white: string;
  black: string;
};

export type CapturedPieces = {
  whiteCaptures: PieceSymbol[];
  blackCaptures: PieceSymbol[];
};
