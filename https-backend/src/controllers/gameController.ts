import type { Request, Response } from "express";
import {
  createChessGame,
  finishChessGame,
  getActiveGameForUser,
  getActiveGameById,
  listActiveGames,
  saveBoardSnapshot,
} from "../services/games/chessStore.js";
import type {
  CreateGameBody,
  FinishGameBody,
  SnapshotBody,
} from "../types/http.js";

export const getActiveGame = async (
  req: Request<{ userId: string }>,
  res: Response,
) => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: "userId is required." });
    return;
  }

  try {
    const game = await getActiveGameForUser(userId);
    res.status(200).json({ game });
  } catch (error) {
    console.error("Failed to fetch active chess game:", error);
    res.status(500).json({ error: "Failed to fetch active chess game." });
  }
};

export const getActiveGameByIdHandler = async (
  req: Request<{ gameId: string }>,
  res: Response,
) => {
  const { gameId } = req.params;

  if (!gameId) {
    res.status(400).json({ error: "gameId is required." });
    return;
  }

  try {
    const game = await getActiveGameById(gameId);
    res.status(200).json({ game });
  } catch (error) {
    console.error("Failed to fetch active game by id:", error);
    res.status(500).json({ error: "Failed to fetch active game." });
  }
};

export const getActiveGames = async (
  _req: Request,
  res: Response,
) => {
  try {
    const games = await listActiveGames();
    res.status(200).json({ games });
  } catch (error) {
    console.error("Failed to list active games:", error);
    res.status(500).json({ error: "Failed to list active games." });
  }
};

export const createGame = async (
  req: Request<unknown, unknown, CreateGameBody>,
  res: Response,
) => {
  try {
    const game = await createChessGame({
      whitePlayerId: req.body.whitePlayerId,
      blackPlayerId: req.body.blackPlayerId,
      initialFen: req.body.initialFen,
    });

    res.status(201).json(game);
  } catch (error) {
    console.error("Failed to create chess game:", error);
    res.status(500).json({ error: "Failed to create chess game." });
  }
};

export const saveSnapshot = async (
  req: Request<{ gameId: string }, unknown, SnapshotBody>,
  res: Response,
) => {
  const { gameId } = req.params;
  const fen = req.body.fen;
  const moveNumber = req.body.moveNumber;
  const sideToMove = req.body.sideToMove;

  if (!fen || moveNumber === undefined || !sideToMove) {
    res.status(400).json({
      error: "fen, moveNumber, and sideToMove are required.",
    });
    return;
  }

  try {
    const snapshot = await saveBoardSnapshot({
      gameId,
      fen,
      moveNumber,
      sideToMove,
      boardState: req.body.boardState,
    });

    res.status(201).json(snapshot);
  } catch (error) {
    console.error("Failed to save chess board snapshot:", error);
    res.status(500).json({ error: "Failed to save chess board snapshot." });
  }
};

export const finishGame = async (
  req: Request<{ gameId: string }, unknown, FinishGameBody>,
  res: Response,
) => {
  const { gameId } = req.params;
  const result = req.body.result;
  const finalFen = req.body.finalFen;

  if (!result || !finalFen) {
    res.status(400).json({ error: "result and finalFen are required." });
    return;
  }

  try {
    const finishedGame = await finishChessGame({
      gameId,
      result,
      winnerId: req.body.winnerId,
      pgn: req.body.pgn,
      finalFen,
    });

    res.status(200).json(finishedGame);
  } catch (error) {
    console.error("Failed to finalize chess game:", error);
    res.status(500).json({ error: "Failed to finalize chess game." });
  }
};
