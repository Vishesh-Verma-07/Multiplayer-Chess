import { Chess, Move, PieceSymbol } from "chess.js";
import {
  CapturedPieces,
  GameNotification,
  MoveRow,
  PlayerColor,
} from "./types";

const captureDisplayOrder: PieceSymbol[] = ["q", "r", "b", "n", "p"];

export const formatPlayerColor = (color: PlayerColor) =>
  color.charAt(0).toUpperCase() + color.slice(1);

const sortCapturedPieces = (pieces: PieceSymbol[]) =>
  [...pieces].sort(
    (left, right) =>
      captureDisplayOrder.indexOf(left) - captureDisplayOrder.indexOf(right),
  );

export const buildStatusText = (
  chess: Chess,
  gameStarted: boolean,
  gameOverWinner: PlayerColor | null,
) => {
  if (!gameStarted) {
    return "Click Start Match to enter matchmaking.";
  }

  if (gameOverWinner) {
    return `${formatPlayerColor(gameOverWinner)} wins the game.`;
  }

  if (chess.isCheckmate()) {
    return "Checkmate.";
  }

  if (chess.isDraw()) {
    return "Draw.";
  }

  if (chess.isCheck()) {
    return "Check.";
  }

  return `${chess.turn() === "w" ? "White" : "Black"} to move.`;
};

export const buildGameNotification = (
  chess: Chess,
  gameStarted: boolean,
  gameOverWinner: PlayerColor | null,
): GameNotification => {
  if (!gameStarted) {
    return null;
  }

  if (gameOverWinner || chess.isCheckmate()) {
    const winner = gameOverWinner
      ? formatPlayerColor(gameOverWinner)
      : chess.turn() === "w"
        ? "Black"
        : "White";

    return {
      message: `Checkmate! ${winner} wins the game.`,
      tone: "critical",
    };
  }

  if (chess.isCheck()) {
    const kingUnderAttack = chess.turn() === "w" ? "White" : "Black";
    return {
      message: `Check on ${kingUnderAttack} king.`,
      tone: "warning",
    };
  }

  return null;
};

export const buildMoveRows = (moveHistory: string[]): MoveRow[] => {
  const rows: MoveRow[] = [];

  for (let i = 0; i < moveHistory.length; i += 2) {
    rows.push({
      turn: i / 2 + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] ?? "",
    });
  }

  return rows;
};

export const buildCapturedPieces = (
  verboseMoveHistory: Move[],
): CapturedPieces => {
  const whiteCaptures: PieceSymbol[] = [];
  const blackCaptures: PieceSymbol[] = [];

  for (const move of verboseMoveHistory) {
    if (!move.captured) {
      continue;
    }

    if (move.color === "w") {
      whiteCaptures.push(move.captured);
    } else {
      blackCaptures.push(move.captured);
    }
  }

  return {
    whiteCaptures: sortCapturedPieces(whiteCaptures),
    blackCaptures: sortCapturedPieces(blackCaptures),
  };
};
