import cors from "cors";
import "dotenv/config";
import type { Request, Response } from "express";
import express from "express";
import {
  createChessGame,
  finishChessGame,
  getActiveGameForUser,
  saveBoardSnapshot,
} from "./chessStore.js";
import {
  AUTH_TOKEN_EXPIRES_IN,
  createAuthToken,
  sanitizeAuthUser,
  verifyAuthToken,
} from "./jwtAuth.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  verifyPassword,
} from "./userStore.js";

const app = express();

const PORT = Number(process.env.PORT ?? "8000");
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "1mb" }));

type CreateGameBody = {
  whitePlayerId?: string;
  blackPlayerId?: string;
  initialFen?: string;
};

type SnapshotBody = {
  fen?: string;
  moveNumber?: number;
  sideToMove?: "w" | "b";
  boardState?: unknown;
};

type FinishGameBody = {
  result?: "WHITE_WIN" | "BLACK_WIN" | "DRAW";
  winnerId?: string;
  pgn?: string;
  finalFen?: string;
};

type RegisterBody = {
  username?: string;
  email?: string;
  password?: string;
};

type LoginBody = {
  identifier?: string;
  password?: string;
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "chess-https-backend",
    uptime: process.uptime(),
  });
});

app.get(
  "/api/games/active/:userId",
  async (req: Request<{ userId: string }>, res: Response) => {
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
  },
);

app.post(
  "/api/games",
  async (req: Request<unknown, unknown, CreateGameBody>, res: Response) => {
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
  },
);

app.post(
  "/api/games/:gameId/snapshots",
  async (
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
  },
);

app.post(
  "/api/games/:gameId/finish",
  async (
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
  },
);

app.post(
  "/api/auth/register",
  async (req: Request<unknown, unknown, RegisterBody>, res: Response) => {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!username || username.length < 3 || username.length > 20) {
      res
        .status(400)
        .json({ error: "Username must be between 3 and 20 characters." });
      return;
    }

    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: "Please provide a valid email address." });
      return;
    }

    if (!password || password.length < 8 || password.length > 72) {
      res
        .status(400)
        .json({ error: "Password must be between 8 and 72 characters." });
      return;
    }

    const existingEmailUser = await findUserByEmail(email);
    if (existingEmailUser) {
      res
        .status(409)
        .json({ error: "An account with this email already exists." });
      return;
    }

    const existingUsernameUser = await findUserByUsername(username);
    if (existingUsernameUser) {
      res.status(409).json({ error: "This username is already taken." });
      return;
    }

    const user = await createUser({ username, email, password });
    const token = createAuthToken(user);

    res.status(201).json({
      token,
      expiresIn: AUTH_TOKEN_EXPIRES_IN,
      user: sanitizeAuthUser(user),
    });
  },
);

app.post(
  "/api/auth/login",
  async (req: Request<unknown, unknown, LoginBody>, res: Response) => {
    const identifier = req.body.identifier?.trim().toLowerCase();
    const password = req.body.password;

    if (!identifier || !password) {
      res.status(400).json({ error: "Identifier and password are required." });
      return;
    }

    const userByEmail = await findUserByEmail(identifier);
    const user = userByEmail ?? (await findUserByUsername(identifier));
    if (!user) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const token = createAuthToken(user);
    res.status(200).json({
      token,
      expiresIn: AUTH_TOKEN_EXPIRES_IN,
      user: sanitizeAuthUser(user),
    });
  },
);

app.get("/api/auth/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }

  const userById = await findUserById(payload.sub);
  if (!userById) {
    res.status(401).json({ error: "Account no longer exists." });
    return;
  }

  res.status(200).json({ user: sanitizeAuthUser(userById) });
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  // JWT auth is stateless. The client forgets the token on logout.
  res.status(200).json({ ok: true });
});

app.get("/api", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Chess auth backend is running.",
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "POST /api/auth/logout",
      "GET /api/health",
    ],
  });
});

const server = app.listen(PORT, () => {
  console.log(`HTTPS backend listening on http://localhost:${PORT}`);
});

// const shutdown = (signal: NodeJS.Signals) => {
//   console.log(`${signal} received, shutting down HTTPS backend...`);
//   server.close(() => {
//     process.exit(0);
//   });
// };

// process.on("SIGINT", () => shutdown("SIGINT"));
// process.on("SIGTERM", () => shutdown("SIGTERM"));
