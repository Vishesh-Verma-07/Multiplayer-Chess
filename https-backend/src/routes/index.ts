import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { gameRoutes } from "./gameRoutes.js";
import { healthRoutes } from "./healthRoutes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/games", gameRoutes);

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "Chess auth backend is running.",
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/me",
      "POST /api/auth/logout",
      "GET /api/health",
      "GET /api/games/active/:userId",
      "POST /api/games",
      "POST /api/games/:gameId/snapshots",
      "POST /api/games/:gameId/finish",
    ],
  });
});

export { router as apiRouter };
