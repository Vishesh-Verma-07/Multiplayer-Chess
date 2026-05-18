export type CreateGameBody = {
  whitePlayerId?: string;
  blackPlayerId?: string;
  initialFen?: string;
};

export type SnapshotBody = {
  fen?: string;
  moveNumber?: number;
  sideToMove?: "w" | "b";
  boardState?: unknown;
};

export type FinishGameBody = {
  result?: "WHITE_WIN" | "BLACK_WIN" | "DRAW";
  winnerId?: string;
  pgn?: string;
  finalFen?: string;
};

export type RegisterBody = {
  username?: string;
  email?: string;
  password?: string;
};

export type LoginBody = {
  identifier?: string;
  password?: string;
};
