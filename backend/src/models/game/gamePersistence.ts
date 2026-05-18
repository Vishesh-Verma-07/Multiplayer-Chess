import { Chess } from "chess.js";
import {
  finishPersistedGame,
  saveBoardSnapshot,
} from "../../db/chessPersistenceClient";
import type { PersistedGameResult } from "../../types/persistence";

export const persistSnapshot = async (params: {
  gameId: string;
  board: Chess;
  moves: number;
}) => {
  await saveBoardSnapshot({
    gameId: params.gameId,
    fen: params.board.fen(),
    moveNumber: params.moves,
    sideToMove: params.board.turn(),
    boardState: params.board.board(),
  });
};

export const persistFinishedGame = async (params: {
  gameId: string;
  board: Chess;
  whitePlayerId: string;
  blackPlayerId: string;
}) => {
  const result = params.board.isDraw()
    ? "DRAW"
    : params.board.turn() === "w"
      ? "BLACK_WIN"
      : "WHITE_WIN";

  const winnerId = params.board.isDraw()
    ? undefined
    : result === "WHITE_WIN"
      ? params.whitePlayerId
      : params.blackPlayerId;

  await finishPersistedGame({
    gameId: params.gameId,
    result,
    winnerId,
    pgn: params.board.pgn(),
    finalFen: params.board.fen(),
  });
};

export const persistFinishedGameWithResult = async (params: {
  gameId: string;
  board: Chess;
  result: PersistedGameResult;
  winnerId?: string;
}) => {
  await finishPersistedGame({
    gameId: params.gameId,
    result: params.result,
    winnerId: params.winnerId,
    pgn: params.board.pgn(),
    finalFen: params.board.fen(),
  });
};
