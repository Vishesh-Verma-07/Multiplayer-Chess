import { Router } from "express";
import {
  createGame,
  finishGame,
  getActiveGameByIdHandler,
  getActiveGames,
  getActiveGame,
  saveSnapshot,
} from "../controllers/gameController.js";

const router = Router();

router.get("/active", getActiveGames);
router.get("/active/game/:gameId", getActiveGameByIdHandler);
router.get("/active/:userId", getActiveGame);
router.post("/", createGame);
router.post("/:gameId/snapshots", saveSnapshot);
router.post("/:gameId/finish", finishGame);

export { router as gameRoutes };
