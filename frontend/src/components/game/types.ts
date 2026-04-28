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

export type GameHeaderProps = {
  statusText: string;
  startButtonText: string;
  startRequested: boolean;
  onStartMatch: () => void;
};

export type GameNotificationBannerProps = {
  gameNotification: GameNotification;
};

export type GameStatCardProps = {
  label: string;
  value: string | number;
};

export type CapturedPiecesRowProps = {
  title: string;
  capturedPieces: PieceSymbol[];
  capturedSidePrefix: "w" | "b";
  capturedSideName: "white" | "black";
};

export type CapturedPiecesPanelProps = {
  capturedPieces: CapturedPieces;
};

export type MoveTrackerPanelProps = {
  moveRows: MoveRow[];
  playerLabel: string;
  currentTurnLabel: string;
  moveCount: number;
  statusText: string;
  isMyTurn: boolean;
  capturedPieces: CapturedPieces;
};
