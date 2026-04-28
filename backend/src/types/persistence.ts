export type PersistedGameResult = "WHITE_WIN" | "BLACK_WIN" | "DRAW";

export type CreatePersistedGameInput = {
  whitePlayerId?: string;
  blackPlayerId?: string;
  initialFen: string;
};

export type SaveBoardSnapshotInput = {
  gameId: string;
  fen: string;
  moveNumber: number;
  sideToMove: "w" | "b";
  boardState: unknown;
};

export type FinishPersistedGameInput = {
  gameId: string;
  result: PersistedGameResult;
  winnerId?: string;
  pgn?: string;
  finalFen: string;
};

export type ActivePersistedGame = {
  gameId: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  currentFen: string;
  movesCount: number;
};
