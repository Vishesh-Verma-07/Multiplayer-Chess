import { GameResult, GameStatus, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

type CreateGameInput = {
  whitePlayerId?: string;
  blackPlayerId?: string;
  initialFen?: string;
};

type RecordMoveInput = {
  gameId: string;
  playerId?: string;
  ply: number;
  fromSquare: string;
  toSquare: string;
  promotion?: string;
  san?: string;
  fenAfter: string;
};

type SaveBoardSnapshotInput = {
  gameId: string;
  fen: string;
  moveNumber: number;
  sideToMove: "w" | "b";
  boardState?: unknown;
};

type FinishGameInput = {
  gameId: string;
  result: GameResult;
  winnerId?: string;
  pgn?: string;
  finalFen: string;
};

export type ActiveGameForUser = {
  gameId: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  currentFen: string;
  movesCount: number;
};

export type ActiveGameSummary = {
  gameId: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  whiteUsername: string | null;
  blackUsername: string | null;
  movesCount: number;
  lastMoveAt: Date | null;
  startedAt: Date | null;
};

export const createChessGame = async ({
  whitePlayerId,
  blackPlayerId,
  initialFen = "startpos",
}: CreateGameInput) => {
  return prisma.chessGame.create({
    data: {
      status: GameStatus.ACTIVE,
      whitePlayerId: whitePlayerId ?? null,
      blackPlayerId: blackPlayerId ?? null,
      initialFen,
      currentFen: initialFen,
      startedAt: new Date(),
    },
  });
};

export const recordMove = async ({
  gameId,
  playerId,
  ply,
  fromSquare,
  toSquare,
  promotion,
  san,
  fenAfter,
}: RecordMoveInput) => {
  return prisma.$transaction(async (tx) => {
    await tx.chessMove.create({
      data: {
        gameId,
        playerId: playerId ?? null,
        ply,
        fromSquare,
        toSquare,
        promotion: promotion ?? null,
        san: san ?? null,
        fenAfter,
      },
    });

    return tx.chessGame.update({
      where: { id: gameId },
      data: {
        currentFen: fenAfter,
        movesCount: {
          increment: 1,
        },
        lastMoveAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });
};

export const saveBoardSnapshot = async ({
  gameId,
  fen,
  moveNumber,
  sideToMove,
  boardState,
}: SaveBoardSnapshotInput) => {
  return prisma.$transaction(async (tx) => {
    await tx.chessBoardSnapshot.create({
      data: {
        gameId,
        fen,
        moveNumber,
        sideToMove,
        ...(boardState !== undefined && boardState !== null
          ? { boardState: boardState as Prisma.InputJsonValue }
          : {}),
      },
    });

    return tx.chessGame.update({
      where: { id: gameId },
      data: {
        currentFen: fen,
        movesCount: moveNumber,
        ...(moveNumber > 0 ? { lastMoveAt: new Date() } : {}),
        updatedAt: new Date(),
      },
    });
  });
};

export const finishChessGame = async ({
  gameId,
  result,
  winnerId,
  pgn,
  finalFen,
}: FinishGameInput) => {
  return prisma.chessGame.update({
    where: { id: gameId },
    data: {
      status: GameStatus.FINISHED,
      result,
      winnerId: winnerId ?? null,
      pgn: pgn ?? null,
      currentFen: finalFen,
      endedAt: new Date(),
      updatedAt: new Date(),
    },
  });
};

export const getActiveGameForUser = async (
  userId: string,
): Promise<ActiveGameForUser | null> => {
  const game = await prisma.chessGame.findFirst({
    where: {
      status: GameStatus.ACTIVE,
      OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      whitePlayerId: true,
      blackPlayerId: true,
      currentFen: true,
      movesCount: true,
    },
  });

  if (!game) {
    return null;
  }

  return {
    gameId: game.id,
    whitePlayerId: game.whitePlayerId,
    blackPlayerId: game.blackPlayerId,
    currentFen: game.currentFen,
    movesCount: game.movesCount,
  };
};

export const getActiveGameById = async (
  gameId: string,
): Promise<ActiveGameForUser | null> => {
  const game = await prisma.chessGame.findFirst({
    where: {
      id: gameId,
      status: GameStatus.ACTIVE,
    },
    select: {
      id: true,
      whitePlayerId: true,
      blackPlayerId: true,
      currentFen: true,
      movesCount: true,
    },
  });

  if (!game) {
    return null;
  }

  return {
    gameId: game.id,
    whitePlayerId: game.whitePlayerId,
    blackPlayerId: game.blackPlayerId,
    currentFen: game.currentFen,
    movesCount: game.movesCount,
  };
};

export const listActiveGames = async (limit = 20): Promise<ActiveGameSummary[]> => {
  const games = await prisma.chessGame.findMany({
    where: {
      status: GameStatus.ACTIVE,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      whitePlayerId: true,
      blackPlayerId: true,
      movesCount: true,
      lastMoveAt: true,
      startedAt: true,
      whitePlayer: {
        select: {
          username: true,
        },
      },
      blackPlayer: {
        select: {
          username: true,
        },
      },
    },
  });

  return games.map((game) => ({
    gameId: game.id,
    whitePlayerId: game.whitePlayerId,
    blackPlayerId: game.blackPlayerId,
    whiteUsername: game.whitePlayer?.username ?? null,
    blackUsername: game.blackPlayer?.username ?? null,
    movesCount: game.movesCount,
    lastMoveAt: game.lastMoveAt,
    startedAt: game.startedAt,
  }));
};
